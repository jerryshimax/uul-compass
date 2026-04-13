/**
 * AI Tool Executors — server-side implementations
 *
 * These are the actual functions the LLM invokes. For READ tools, the
 * AI SDK runs them inline during streaming (auto-execute). For WRITE
 * tools, the LLM returns a pending tool call; the client UI renders
 * a Confirm card; on Confirm, the client POSTs to /api/ai/tool/execute
 * which calls the corresponding executor here.
 *
 * Contract:
 *   - Each executor takes (args, ctx) where ctx carries the current user
 *     (for permission checking) and the conversation (for audit trail).
 *   - Every executor MUST verify entity access before reading or writing.
 *   - Every executor returns a serializable result that the LLM can reason
 *     about in its next turn.
 */

import { db } from "@/db";
import {
  pmiTasks,
  risks,
  opportunities,
  demandSignals,
  carrierContracts,
  handoffs,
  aiEmbeddings,
  meetingNotes,
  users,
  offices,
  officeStatus,
  watches,
} from "@/db/schema";
import { and, desc, eq, inArray, like, or, gte, lte, sql } from "drizzle-orm";
import type { CurrentUser } from "@/lib/supabase/get-current-user";
import { requireEntityWrite } from "@/lib/supabase/get-current-user";
import { checkToolPermission } from "./tools";

export type ExecutorContext = {
  user: CurrentUser;
  conversationId: string | null;
  messageId?: string;
};

export type ExecutorResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
  citations?: Array<{ type: "db" | "brain"; id: string; label: string; url?: string }>;
};

// ─── READ EXECUTORS ────────────────────────────────────────────

export async function execQueryTasks(
  args: {
    status?: "todo" | "in_progress" | "blocked" | "review" | "done";
    assigneeId?: string;
    workstreamId?: string;
    priority?: "critical" | "high" | "medium" | "low";
    limit?: number;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult> {
  checkToolPermission(ctx.user, "query_tasks", args);

  const conditions = [];
  if (args.status) conditions.push(eq(pmiTasks.status, args.status));
  if (args.assigneeId) conditions.push(eq(pmiTasks.assigneeId, args.assigneeId));
  if (args.workstreamId) conditions.push(eq(pmiTasks.workstreamId, args.workstreamId));
  if (args.priority) conditions.push(eq(pmiTasks.priority, args.priority));

  const rows = await db
    .select({
      id: pmiTasks.id,
      taskCode: pmiTasks.taskCode,
      title: pmiTasks.title,
      status: pmiTasks.status,
      priority: pmiTasks.priority,
      dueDate: pmiTasks.dueDate,
      progress: pmiTasks.progress,
      assigneeId: pmiTasks.assigneeId,
    })
    .from(pmiTasks)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(pmiTasks.updatedAt))
    .limit(args.limit ?? 20);

  return {
    ok: true,
    data: { count: rows.length, tasks: rows },
    citations: rows.map((r) => ({
      type: "db" as const,
      id: r.id,
      label: r.taskCode ? `${r.taskCode}: ${r.title}` : r.title,
      url: `/tasks/${r.id}`,
    })),
  };
}

export async function execQueryRisks(
  args: {
    severity?: "high" | "medium" | "low";
    status?: "open" | "mitigating" | "resolved";
    ownerId?: string;
    workstreamId?: string;
    limit?: number;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult> {
  checkToolPermission(ctx.user, "query_risks", args);

  const conditions = [];
  if (args.severity) conditions.push(eq(risks.severity, args.severity));
  if (args.status) conditions.push(eq(risks.status, args.status));
  if (args.ownerId) conditions.push(eq(risks.ownerId, args.ownerId));
  if (args.workstreamId) conditions.push(eq(risks.workstreamId, args.workstreamId));

  const rows = await db
    .select()
    .from(risks)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(risks.updatedAt))
    .limit(args.limit ?? 20);

  return {
    ok: true,
    data: { count: rows.length, risks: rows },
    citations: rows.map((r) => ({
      type: "db" as const,
      id: r.id,
      label: `${r.severity.toUpperCase()}: ${r.title}`,
      url: `/risks/${r.id}`,
    })),
  };
}

export async function execQueryOpportunities(
  args: {
    stage?: "lead" | "qualified" | "quoted" | "negotiating" | "won" | "lost";
    salespersonId?: string;
    customerName?: string;
    limit?: number;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult> {
  checkToolPermission(ctx.user, "query_opportunities", args);

  const conditions = [
    inArray(opportunities.entityId, ctx.user.accessibleEntityIds),
  ];
  if (args.stage) conditions.push(eq(opportunities.stage, args.stage));
  if (args.salespersonId) conditions.push(eq(opportunities.salespersonId, args.salespersonId));
  if (args.customerName) {
    conditions.push(like(opportunities.customerName, `%${args.customerName}%`));
  }

  const rows = await db
    .select()
    .from(opportunities)
    .where(and(...conditions))
    .orderBy(desc(opportunities.updatedAt))
    .limit(args.limit ?? 20);

  return {
    ok: true,
    data: { count: rows.length, opportunities: rows },
    citations: rows.map((r) => ({
      type: "db" as const,
      id: r.id,
      label: `${r.customerName}${r.lane ? ` (${r.lane})` : ""}`,
      url: `/pipeline/opportunities/${r.id}`,
    })),
  };
}

export async function execQueryDemandSignals(
  args: {
    lane?: string;
    commodity?: string;
    confidence?: "low" | "medium" | "high";
    monthFilter?: string;
    limit?: number;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult> {
  checkToolPermission(ctx.user, "query_demand_signals", args);

  const conditions = [
    inArray(demandSignals.entityId, ctx.user.accessibleEntityIds),
  ];
  if (args.lane) conditions.push(like(demandSignals.lane, `%${args.lane}%`));
  if (args.commodity) conditions.push(like(demandSignals.commodity, `%${args.commodity}%`));
  if (args.confidence) conditions.push(eq(demandSignals.confidence, args.confidence));
  if (args.monthFilter) {
    const [year, month] = args.monthFilter.split("-");
    const start = new Date(`${year}-${month}-01`);
    const end = new Date(Number(year), Number(month), 1);
    conditions.push(gte(demandSignals.expectedStartDate, start));
    conditions.push(lte(demandSignals.expectedStartDate, end));
  }

  const rows = await db
    .select()
    .from(demandSignals)
    .where(and(...conditions))
    .orderBy(desc(demandSignals.expectedStartDate))
    .limit(args.limit ?? 20);

  return {
    ok: true,
    data: { count: rows.length, signals: rows },
    citations: rows.map((r) => ({
      type: "db" as const,
      id: r.id,
      label: `${r.expectedVolumeTeu} TEU ${r.lane} (${r.confidence} confidence)`,
      url: `/pipeline/demand/${r.id}`,
    })),
  };
}

export async function execQueryCarrierContracts(
  args: {
    carrier?: string;
    lane?: string;
    status?: "in_negotiation" | "active" | "expired" | "terminated";
    utilizationAbove?: number;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult> {
  checkToolPermission(ctx.user, "query_carrier_contracts", args);

  const conditions = [
    inArray(carrierContracts.entityId, ctx.user.accessibleEntityIds),
  ];
  if (args.carrier) conditions.push(like(carrierContracts.carrierName, `%${args.carrier}%`));
  if (args.lane) conditions.push(like(carrierContracts.lane, `%${args.lane}%`));
  if (args.status) conditions.push(eq(carrierContracts.status, args.status));

  // Utilization filter via SQL expression: utilized / committed >= threshold
  if (args.utilizationAbove !== undefined && args.utilizationAbove >= 0) {
    conditions.push(
      sql`(${carrierContracts.mqcUtilized}::float / NULLIF(${carrierContracts.mqcCommitted}, 0)) * 100 >= ${args.utilizationAbove}`,
    );
  }

  const rows = await db
    .select()
    .from(carrierContracts)
    .where(and(...conditions))
    .orderBy(desc(carrierContracts.validityEnd));

  const enriched = rows.map((r) => ({
    ...r,
    utilizationPct: r.mqcCommitted > 0 ? Math.round((r.mqcUtilized / r.mqcCommitted) * 100) : 0,
  }));

  return {
    ok: true,
    data: { count: enriched.length, contracts: enriched },
    citations: enriched.map((r) => ({
      type: "db" as const,
      id: r.id,
      label: `${r.carrierName} ${r.lane} (${r.utilizationPct}% used)`,
      url: `/pipeline/contracts/${r.id}`,
    })),
  };
}

export async function execQueryBrain(
  args: {
    query: string;
    sourceTypes?: string[];
    limit?: number;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult> {
  checkToolPermission(ctx.user, "query_brain", args);

  // Embed the query and do cosine similarity search. For now, return
  // placeholder until embedText is wired (David needs to install @ai-sdk/openai).
  //
  // Full implementation:
  //   const queryEmbedding = await embedText(args.query);
  //   const rows = await db.execute(sql`
  //     SELECT source_type, source_id, text, metadata,
  //            1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
  //     FROM ai_embeddings
  //     WHERE entity_id = ANY(${ctx.user.accessibleEntityIds}::uuid[])
  //       ${args.sourceTypes ? sql`AND source_type = ANY(${args.sourceTypes}::text[])` : sql``}
  //     ORDER BY embedding <=> ${queryEmbedding}::vector
  //     LIMIT ${args.limit ?? 8}
  //   `);

  return {
    ok: true,
    data: {
      query: args.query,
      results: [],
      note: "Brain search requires embeddings to be indexed. David: run indexer after pgvector is enabled.",
    },
  };
}

export async function execFindMeeting(
  args: {
    query: string;
    dateRange?: { from?: string; to?: string };
    meetingType?: "board" | "leadership" | "department" | "strategy";
    limit?: number;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult> {
  checkToolPermission(ctx.user, "find_meeting", args);

  const conditions = [
    inArray(meetingNotes.entityId, ctx.user.accessibleEntityIds),
  ];

  if (args.query) {
    conditions.push(
      or(
        like(meetingNotes.title, `%${args.query}%`),
        like(meetingNotes.body, `%${args.query}%`),
      )!,
    );
  }
  if (args.meetingType) conditions.push(eq(meetingNotes.meetingType, args.meetingType));
  if (args.dateRange?.from) conditions.push(gte(meetingNotes.meetingDate, new Date(args.dateRange.from)));
  if (args.dateRange?.to) conditions.push(lte(meetingNotes.meetingDate, new Date(args.dateRange.to)));

  const rows = await db
    .select({
      id: meetingNotes.id,
      title: meetingNotes.title,
      meetingType: meetingNotes.meetingType,
      meetingDate: meetingNotes.meetingDate,
      decisions: meetingNotes.decisions,
    })
    .from(meetingNotes)
    .where(and(...conditions))
    .orderBy(desc(meetingNotes.meetingDate))
    .limit(args.limit ?? 5);

  return {
    ok: true,
    data: { count: rows.length, meetings: rows },
    citations: rows.map((r) => ({
      type: "db" as const,
      id: r.id,
      label: `${r.title} (${r.meetingDate})`,
      url: `/decisions#meeting-${r.id}`,
    })),
  };
}

export async function execQueryHandoffs(
  args: {
    status?: "sent" | "seen" | "acknowledged" | "in_progress" | "completed" | "declined";
    direction?: "incoming" | "outgoing" | "both";
    urgency?: "low" | "medium" | "high" | "urgent";
    limit?: number;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult> {
  checkToolPermission(ctx.user, "query_handoffs", args);

  const conditions = [
    inArray(handoffs.entityId, ctx.user.accessibleEntityIds),
  ];
  if (args.status) conditions.push(eq(handoffs.status, args.status));
  if (args.urgency) conditions.push(eq(handoffs.urgency, args.urgency));

  const direction = args.direction ?? "both";
  if (direction === "incoming") {
    conditions.push(eq(handoffs.toUserId, ctx.user.id));
  } else if (direction === "outgoing") {
    conditions.push(eq(handoffs.fromUserId, ctx.user.id));
  } else {
    conditions.push(
      or(eq(handoffs.toUserId, ctx.user.id), eq(handoffs.fromUserId, ctx.user.id))!,
    );
  }

  const rows = await db
    .select()
    .from(handoffs)
    .where(and(...conditions))
    .orderBy(desc(handoffs.createdAt))
    .limit(args.limit ?? 20);

  return {
    ok: true,
    data: { count: rows.length, handoffs: rows },
    citations: rows.map((r) => ({
      type: "db" as const,
      id: r.id,
      label: `${r.urgency}: ${r.subject}`,
      url: `/handoffs/${r.id}`,
    })),
  };
}

// ─── WRITE EXECUTORS ───────────────────────────────────────────
// These run AFTER user confirmation (via /api/ai/tool/execute).
// Permission re-checked here (defense in depth).

export async function execCreateTask(
  args: {
    title: string;
    description?: string;
    workstreamId: string;
    assigneeId?: string;
    priority?: "critical" | "high" | "medium" | "low";
    dueDate?: string;
    phase?: number;
    entityId: string;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult<{ taskId: string }>> {
  checkToolPermission(ctx.user, "create_task", args);
  requireEntityWrite(ctx.user, args.entityId);

  const [row] = await db
    .insert(pmiTasks)
    .values({
      title: args.title,
      description: args.description,
      workstreamId: args.workstreamId,
      assigneeId: args.assigneeId ?? ctx.user.id,
      priority: args.priority ?? "medium",
      dueDate: args.dueDate ? new Date(args.dueDate) : null,
      phase: args.phase ?? 1,
      reporterId: ctx.user.id,
      status: "todo",
      progress: 0,
    })
    .returning({ id: pmiTasks.id });

  return {
    ok: true,
    data: { taskId: row.id },
    citations: [{ type: "db", id: row.id, label: `New task: ${args.title}`, url: `/tasks/${row.id}` }],
  };
}

export async function execCreateOpportunity(
  args: {
    customerName: string;
    description?: string;
    salespersonId?: string;
    stage?: "lead" | "qualified" | "quoted" | "negotiating" | "won" | "lost";
    expectedValueCents?: number;
    expectedCloseDate?: string;
    lane?: string;
    commodity?: string;
    volumeTeu?: number;
    entityId: string;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult<{ opportunityId: string }>> {
  checkToolPermission(ctx.user, "create_opportunity", args);
  requireEntityWrite(ctx.user, args.entityId);

  const [row] = await db
    .insert(opportunities)
    .values({
      customerName: args.customerName,
      description: args.description,
      salespersonId: args.salespersonId ?? ctx.user.id,
      stage: args.stage ?? "lead",
      expectedValueCents: args.expectedValueCents ?? null,
      expectedCloseDate: args.expectedCloseDate ? new Date(args.expectedCloseDate) : null,
      lane: args.lane,
      commodity: args.commodity,
      volumeTeu: args.volumeTeu ?? null,
      entityId: args.entityId,
      createdByAi: true,
      aiConversationId: ctx.conversationId,
    })
    .returning({ id: opportunities.id });

  return {
    ok: true,
    data: { opportunityId: row.id },
    citations: [{ type: "db", id: row.id, label: `Opportunity: ${args.customerName}`, url: `/pipeline/opportunities/${row.id}` }],
  };
}

export async function execLogDemandSignal(
  args: {
    lane: string;
    commodity?: string;
    customerName?: string;
    salespersonId?: string;
    expectedVolumeTeu: number;
    expectedStartDate: string;
    confidence: "low" | "medium" | "high";
    notes?: string;
    entityId: string;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult<{ demandSignalId: string }>> {
  checkToolPermission(ctx.user, "log_demand_signal", args);
  requireEntityWrite(ctx.user, args.entityId);

  const [row] = await db
    .insert(demandSignals)
    .values({
      lane: args.lane,
      commodity: args.commodity,
      customerName: args.customerName,
      salespersonId: args.salespersonId ?? ctx.user.id,
      expectedVolumeTeu: args.expectedVolumeTeu,
      expectedStartDate: new Date(args.expectedStartDate),
      confidence: args.confidence,
      notes: args.notes,
      entityId: args.entityId,
      createdByAi: true,
      aiConversationId: ctx.conversationId,
    })
    .returning({ id: demandSignals.id });

  return {
    ok: true,
    data: { demandSignalId: row.id },
    citations: [{ type: "db", id: row.id, label: `Demand: ${args.expectedVolumeTeu} TEU ${args.lane}`, url: `/pipeline/demand/${row.id}` }],
  };
}

export async function execDraftHandoff(
  args: {
    toUserId?: string;
    toDepartment?: string;
    subject: string;
    context: string;
    requestedAction: string;
    urgency?: "low" | "medium" | "high" | "urgent";
    dueBy?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult<{ handoffId: string }>> {
  checkToolPermission(ctx.user, "draft_handoff", args);

  // Handoffs inherit user's primary entity (first accessible)
  const entityId = ctx.user.accessibleEntityIds[0];
  if (!entityId) {
    return { ok: false, error: "User has no accessible entities" };
  }

  const [row] = await db
    .insert(handoffs)
    .values({
      fromUserId: ctx.user.id,
      toUserId: args.toUserId ?? null,
      toDepartmentCode: args.toDepartment ?? null,
      subject: args.subject,
      context: args.context,
      requestedAction: args.requestedAction,
      urgency: args.urgency ?? "medium",
      dueBy: args.dueBy ? new Date(args.dueBy) : null,
      relatedType: args.relatedEntityType ?? null,
      relatedId: args.relatedEntityId ?? null,
      status: "sent",
      entityId,
      draftedByAi: true,
      aiConversationId: ctx.conversationId,
    })
    .returning({ id: handoffs.id });

  return {
    ok: true,
    data: { handoffId: row.id },
    citations: [{ type: "db", id: row.id, label: `Handoff: ${args.subject}`, url: `/handoffs/${row.id}` }],
  };
}

export async function execWatchEntity(
  args: {
    targetType: string;
    targetId: string;
    watchType?: "any_change" | "major_only" | "mentions_only";
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult> {
  checkToolPermission(ctx.user, "watch_entity", args);

  await db
    .insert(watches)
    .values({
      userId: ctx.user.id,
      targetType: args.targetType,
      targetId: args.targetId,
      watchType: args.watchType ?? "any_change",
    })
    .onConflictDoNothing();

  return { ok: true, data: { watching: true } };
}

export async function execUpdateTask(
  args: {
    taskId: string;
    status?: "todo" | "in_progress" | "blocked" | "review" | "done";
    priority?: "critical" | "high" | "medium" | "low";
    assigneeId?: string;
    dueDate?: string;
    progress?: number;
    notes?: string;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult<{ taskId: string }>> {
  checkToolPermission(ctx.user, "update_task", args);

  // Fetch task first to verify entity access (tasks inherit entity via workstream)
  const [existing] = await db
    .select({ id: pmiTasks.id })
    .from(pmiTasks)
    .where(eq(pmiTasks.id, args.taskId))
    .limit(1);
  if (!existing) return { ok: false, error: "Task not found" };

  const updates: Record<string, unknown> = {};
  if (args.status !== undefined) updates.status = args.status;
  if (args.priority !== undefined) updates.priority = args.priority;
  if (args.assigneeId !== undefined) updates.assigneeId = args.assigneeId;
  if (args.dueDate !== undefined) updates.dueDate = new Date(args.dueDate);
  if (args.progress !== undefined) updates.progress = args.progress;
  if (args.notes !== undefined) updates.notes = args.notes;
  updates.updatedAt = new Date();

  await db.update(pmiTasks).set(updates).where(eq(pmiTasks.id, args.taskId));

  return {
    ok: true,
    data: { taskId: args.taskId },
    citations: [{ type: "db", id: args.taskId, label: "Updated task", url: `/tasks/${args.taskId}` }],
  };
}

export async function execCreateRisk(
  args: {
    title: string;
    description?: string;
    severity: "high" | "medium" | "low";
    ownerId?: string;
    workstreamId?: string;
    mitigationPlan?: string;
    targetDate?: string;
    entityId: string;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult<{ riskId: string }>> {
  checkToolPermission(ctx.user, "create_risk", args);
  requireEntityWrite(ctx.user, args.entityId);

  const [row] = await db
    .insert(risks)
    .values({
      title: args.title,
      description: args.description,
      severity: args.severity,
      status: "open",
      ownerId: args.ownerId ?? ctx.user.id,
      workstreamId: args.workstreamId ?? null,
      mitigationPlan: args.mitigationPlan,
      targetDate: args.targetDate ? new Date(args.targetDate) : null,
      raisedDate: new Date(),
    })
    .returning({ id: risks.id });

  return {
    ok: true,
    data: { riskId: row.id },
    citations: [{ type: "db", id: row.id, label: `Risk: ${args.title}`, url: `/risks/${row.id}` }],
  };
}

export async function execUpdateRisk(
  args: {
    riskId: string;
    severity?: "high" | "medium" | "low";
    status?: "open" | "mitigating" | "resolved";
    mitigationPlan?: string;
    notes?: string;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult<{ riskId: string }>> {
  checkToolPermission(ctx.user, "update_risk", args);

  const [existing] = await db
    .select({ id: risks.id })
    .from(risks)
    .where(eq(risks.id, args.riskId))
    .limit(1);
  if (!existing) return { ok: false, error: "Risk not found" };

  const updates: Record<string, unknown> = {};
  if (args.severity !== undefined) updates.severity = args.severity;
  if (args.status !== undefined) {
    updates.status = args.status;
    if (args.status === "resolved") updates.resolvedDate = new Date();
  }
  if (args.mitigationPlan !== undefined) updates.mitigationPlan = args.mitigationPlan;
  if (args.notes !== undefined) updates.notes = args.notes;
  updates.updatedAt = new Date();

  await db.update(risks).set(updates).where(eq(risks.id, args.riskId));

  return {
    ok: true,
    data: { riskId: args.riskId },
    citations: [{ type: "db", id: args.riskId, label: "Updated risk", url: `/risks/${args.riskId}` }],
  };
}

export async function execUpdateOpportunityStage(
  args: {
    opportunityId: string;
    newStage: "lead" | "qualified" | "quoted" | "negotiating" | "won" | "lost";
    notes?: string;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult<{ opportunityId: string }>> {
  checkToolPermission(ctx.user, "update_opportunity_stage", args);

  const [existing] = await db
    .select({ id: opportunities.id, entityId: opportunities.entityId })
    .from(opportunities)
    .where(eq(opportunities.id, args.opportunityId))
    .limit(1);
  if (!existing) return { ok: false, error: "Opportunity not found" };
  requireEntityWrite(ctx.user, existing.entityId);

  await db
    .update(opportunities)
    .set({
      stage: args.newStage,
      stageChangedAt: new Date(),
      updatedAt: new Date(),
      ...(args.newStage === "won"
        ? { wonValueCents: null /* caller should update separately */ }
        : {}),
    })
    .where(eq(opportunities.id, args.opportunityId));

  return {
    ok: true,
    data: { opportunityId: args.opportunityId },
    citations: [
      {
        type: "db",
        id: args.opportunityId,
        label: `Opportunity → ${args.newStage}`,
        url: `/pipeline/opportunities/${args.opportunityId}`,
      },
    ],
  };
}

export async function execUpdateOfficeStatus(
  args: {
    officeId: string;
    currentFocus: string;
    capacityIndicator: "green" | "yellow" | "red";
    blockers?: string;
  },
  ctx: ExecutorContext,
): Promise<ExecutorResult> {
  checkToolPermission(ctx.user, "update_office_status", args);

  // Upsert — one status per office
  await db
    .insert(officeStatus)
    .values({
      officeId: args.officeId,
      currentFocus: args.currentFocus,
      capacityIndicator: args.capacityIndicator,
      blockers: args.blockers,
      setByUserId: ctx.user.id,
      setAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [officeStatus.officeId],
      set: {
        currentFocus: args.currentFocus,
        capacityIndicator: args.capacityIndicator,
        blockers: args.blockers,
        setByUserId: ctx.user.id,
        setAt: new Date(),
        updatedAt: new Date(),
      },
    });

  return { ok: true, data: { officeId: args.officeId } };
}

// ─── Registry: tool name → executor function ───────────────────
// Used by /api/ai/chat (for inline read execution) and
// /api/ai/tool/execute (for confirmed write execution).

export const READ_EXECUTORS = {
  query_tasks: execQueryTasks,
  query_risks: execQueryRisks,
  query_opportunities: execQueryOpportunities,
  query_demand_signals: execQueryDemandSignals,
  query_carrier_contracts: execQueryCarrierContracts,
  query_brain: execQueryBrain,
  find_meeting: execFindMeeting,
  query_handoffs: execQueryHandoffs,
} as const;

export const WRITE_EXECUTORS = {
  create_task: execCreateTask,
  update_task: execUpdateTask,
  create_risk: execCreateRisk,
  update_risk: execUpdateRisk,
  create_opportunity: execCreateOpportunity,
  update_opportunity_stage: execUpdateOpportunityStage,
  log_demand_signal: execLogDemandSignal,
  draft_handoff: execDraftHandoff,
  update_office_status: execUpdateOfficeStatus,
  watch_entity: execWatchEntity,
  // TODO: log_decision — requires a generic decisions table
  //       (currently governance.ts has only PMI-specific decision gates).
} as const;

export type ReadToolName = keyof typeof READ_EXECUTORS;
export type WriteToolName = keyof typeof WRITE_EXECUTORS;
