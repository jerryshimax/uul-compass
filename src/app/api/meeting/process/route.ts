import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  pmiTasks,
  pmiWorkstreams,
  risks,
  valueInitiatives,
  meetingNotes,
  meetingAttendees,
  activities,
  users,
} from "@/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import { verifyBearerToken, unauthorizedResponse } from "@/lib/api/auth";

// ─── Types ──────────────────────────────────────────────────────

interface MeetingSource {
  type: "board" | "leadership" | "department" | "strategy";
  title: string;
  date: string; // YYYY-MM-DD
  participants?: string[];
}

interface TaskUpdate {
  task_id: string;
  updates: {
    status?: string;
    progress?: number;
    notes?: string;
  };
}

interface NewTask {
  title: string;
  workstream?: string;
  assignee?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  notes?: string;
}

interface RiskUpdate {
  risk_id: string;
  updates: {
    severity?: string;
    status?: string;
    notes?: string;
  };
}

interface NewRisk {
  title: string;
  severity?: string;
  workstream?: string;
  owner?: string;
  description?: string;
  mitigation?: string;
}

interface InitiativeUpdate {
  initiative_id: string;
  updates: {
    progress?: number;
    notes?: string;
  };
}

interface RequestBody {
  source: MeetingSource;
  task_updates?: TaskUpdate[];
  new_tasks?: NewTask[];
  risk_updates?: RiskUpdate[];
  new_risks?: NewRisk[];
  initiative_updates?: InitiativeUpdate[];
}

interface ApiError {
  type: string;
  task_id?: string;
  risk_id?: string;
  initiative_id?: string;
  index?: number;
  error: string;
}

// ─── Helpers ────────────────────────────────────────────────────

async function resolveUserByName(name: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      or(
        ilike(users.fullName, name),
        ilike(users.fullNameZh, name)
      )
    )
    .limit(1);
  return user?.id ?? null;
}

async function resolveWorkstreamByName(name: string): Promise<string | null> {
  const [ws] = await db
    .select({ id: pmiWorkstreams.id })
    .from(pmiWorkstreams)
    .where(ilike(pmiWorkstreams.name, name))
    .limit(1);
  return ws?.id ?? null;
}

function changesMap(
  oldVals: Record<string, unknown>,
  newVals: Record<string, unknown>
): Record<string, string> {
  const changes: Record<string, string> = {};
  for (const key of Object.keys(newVals)) {
    if (newVals[key] !== undefined && oldVals[key] !== newVals[key]) {
      changes[key] = `${oldVals[key]} -> ${newVals[key]}`;
    }
  }
  return changes;
}

// ─── Route Handler ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!verifyBearerToken(request)) return unauthorizedResponse();

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.source?.title || !body.source?.date) {
    return Response.json(
      { error: "source.title and source.date are required" },
      { status: 400 }
    );
  }

  const errors: ApiError[] = [];
  const summary = {
    tasks_updated: 0,
    tasks_created: 0,
    risks_updated: 0,
    risks_created: 0,
    initiatives_updated: 0,
  };
  const details: {
    tasks_updated: { task_id: string; title: string; changes: Record<string, string> }[];
    tasks_created: { task_id: string; title: string }[];
    risks_updated: { risk_id: string; title: string; changes: Record<string, string> }[];
    risks_created: { risk_id: string; title: string }[];
    initiatives_updated: { initiative_id: string; name: string; changes: Record<string, string> }[];
  } = {
    tasks_updated: [],
    tasks_created: [],
    risks_updated: [],
    risks_created: [],
    initiatives_updated: [],
  };

  // ── 1. Create meeting_notes record ──────────────────────────────
  const [meeting] = await db
    .insert(meetingNotes)
    .values({
      title: body.source.title,
      meetingDate: body.source.date,
      meetingType: body.source.type,
    })
    .returning({ id: meetingNotes.id });

  const meetingId = meeting.id;

  // ── 2. Resolve and link participants ────────────────────────────
  if (body.source.participants?.length) {
    for (const name of body.source.participants) {
      const userId = await resolveUserByName(name);
      if (userId) {
        await db
          .insert(meetingAttendees)
          .values({ meetingId, userId })
          .onConflictDoNothing();
      }
    }
  }

  // ── 3. Task updates ─────────────────────────────────────────────
  for (const tu of body.task_updates ?? []) {
    const [existing] = await db
      .select({
        id: pmiTasks.id,
        title: pmiTasks.title,
        status: pmiTasks.status,
        progress: pmiTasks.progress,
        notes: pmiTasks.notes,
      })
      .from(pmiTasks)
      .where(eq(pmiTasks.id, tu.task_id))
      .limit(1);

    if (!existing) {
      errors.push({ type: "task_update", task_id: tu.task_id, error: "Task not found" });
      continue;
    }

    const patch: Record<string, unknown> = { updatedAt: new Date(), meetingId };
    if (tu.updates.status !== undefined) patch.status = tu.updates.status;
    if (tu.updates.progress !== undefined) patch.progress = tu.updates.progress;
    if (tu.updates.notes !== undefined) patch.notes = tu.updates.notes;

    await db.update(pmiTasks).set(patch).where(eq(pmiTasks.id, tu.task_id));

    const changes = changesMap(
      { status: existing.status, progress: existing.progress, notes: existing.notes },
      { status: tu.updates.status, progress: tu.updates.progress, notes: tu.updates.notes }
    );

    await db.insert(activities).values({
      targetType: "task",
      targetId: existing.id,
      action: "updated",
      targetLabel: existing.title,
      changes,
    });

    details.tasks_updated.push({ task_id: existing.id, title: existing.title, changes });
    summary.tasks_updated++;
  }

  // ── 4. New tasks ─────────────────────────────────────────────────
  for (const [i, nt] of (body.new_tasks ?? []).entries()) {
    if (!nt.title) {
      errors.push({ type: "new_task", index: i, error: "Missing required field: title" });
      continue;
    }

    let workstreamId: string | null = null;
    if (nt.workstream) {
      workstreamId = await resolveWorkstreamByName(nt.workstream);
      if (!workstreamId) {
        errors.push({ type: "new_task", index: i, error: `Workstream not found: '${nt.workstream}'` });
        continue;
      }
    }

    let assigneeId: string | null = null;
    if (nt.assignee) {
      assigneeId = await resolveUserByName(nt.assignee);
      if (!assigneeId) {
        errors.push({ type: "new_task", index: i, error: `User not found: '${nt.assignee}'` });
        continue;
      }
    }

    const [created] = await db
      .insert(pmiTasks)
      .values({
        title: nt.title,
        workstreamId: workstreamId!,
        assigneeId,
        priority: (nt.priority as "critical" | "high" | "medium" | "low") ?? "medium",
        status: (nt.status as "todo" | "in_progress" | "blocked" | "review" | "done") ?? "todo",
        dueDate: nt.due_date ?? null,
        notes: nt.notes ?? null,
        phase: 1,
        meetingId,
      })
      .returning({ id: pmiTasks.id, title: pmiTasks.title });

    await db.insert(activities).values({
      targetType: "task",
      targetId: created.id,
      action: "created",
      targetLabel: created.title,
    });

    details.tasks_created.push({ task_id: created.id, title: created.title });
    summary.tasks_created++;
  }

  // ── 5. Risk updates ──────────────────────────────────────────────
  for (const ru of body.risk_updates ?? []) {
    const [existing] = await db
      .select({
        id: risks.id,
        title: risks.title,
        severity: risks.severity,
        status: risks.status,
        notes: risks.notes,
      })
      .from(risks)
      .where(eq(risks.id, ru.risk_id))
      .limit(1);

    if (!existing) {
      errors.push({ type: "risk_update", risk_id: ru.risk_id, error: "Risk not found" });
      continue;
    }

    const patch: Record<string, unknown> = { updatedAt: new Date(), meetingId };
    if (ru.updates.severity !== undefined) patch.severity = ru.updates.severity;
    if (ru.updates.status !== undefined) patch.status = ru.updates.status;
    if (ru.updates.notes !== undefined) patch.notes = ru.updates.notes;

    await db.update(risks).set(patch).where(eq(risks.id, ru.risk_id));

    const changes = changesMap(
      { severity: existing.severity, status: existing.status, notes: existing.notes },
      { severity: ru.updates.severity, status: ru.updates.status, notes: ru.updates.notes }
    );

    await db.insert(activities).values({
      targetType: "risk",
      targetId: existing.id,
      action: "updated",
      targetLabel: existing.title,
      changes,
    });

    details.risks_updated.push({ risk_id: existing.id, title: existing.title, changes });
    summary.risks_updated++;
  }

  // ── 6. New risks ─────────────────────────────────────────────────
  for (const [i, nr] of (body.new_risks ?? []).entries()) {
    if (!nr.title) {
      errors.push({ type: "new_risk", index: i, error: "Missing required field: title" });
      continue;
    }

    let workstreamId: string | null = null;
    if (nr.workstream) {
      workstreamId = await resolveWorkstreamByName(nr.workstream);
      if (!workstreamId) {
        errors.push({ type: "new_risk", index: i, error: `Workstream not found: '${nr.workstream}'` });
        continue;
      }
    }

    let ownerId: string | null = null;
    if (nr.owner) {
      ownerId = await resolveUserByName(nr.owner);
      if (!ownerId) {
        errors.push({ type: "new_risk", index: i, error: `User not found: '${nr.owner}'` });
        continue;
      }
    }

    const [created] = await db
      .insert(risks)
      .values({
        title: nr.title,
        severity: (nr.severity as "high" | "medium" | "low") ?? "medium",
        status: "open",
        description: nr.description ?? null,
        mitigationPlan: nr.mitigation ?? null,
        workstreamId,
        ownerId,
        meetingId,
        raisedDate: body.source.date,
      })
      .returning({ id: risks.id, title: risks.title });

    await db.insert(activities).values({
      targetType: "risk",
      targetId: created.id,
      action: "created",
      targetLabel: created.title,
    });

    details.risks_created.push({ risk_id: created.id, title: created.title });
    summary.risks_created++;
  }

  // ── 7. Initiative updates ────────────────────────────────────────
  for (const iu of body.initiative_updates ?? []) {
    const [existing] = await db
      .select({
        id: valueInitiatives.id,
        name: valueInitiatives.name,
        progress: valueInitiatives.progress,
      })
      .from(valueInitiatives)
      .where(eq(valueInitiatives.id, iu.initiative_id))
      .limit(1);

    if (!existing) {
      errors.push({ type: "initiative_update", initiative_id: iu.initiative_id, error: "Initiative not found" });
      continue;
    }

    const patch: Record<string, unknown> = { updatedAt: new Date(), meetingId };
    if (iu.updates.progress !== undefined) patch.progress = iu.updates.progress;
    if (iu.updates.notes !== undefined) patch.notes = iu.updates.notes;

    await db.update(valueInitiatives).set(patch).where(eq(valueInitiatives.id, iu.initiative_id));

    const changes = changesMap(
      { progress: existing.progress },
      { progress: iu.updates.progress }
    );

    await db.insert(activities).values({
      targetType: "initiative",
      targetId: existing.id,
      action: "updated",
      targetLabel: existing.name,
      changes,
    });

    details.initiatives_updated.push({ initiative_id: existing.id, name: existing.name, changes });
    summary.initiatives_updated++;
  }

  const success = errors.length === 0;

  return Response.json({
    success,
    meeting_id: meetingId,
    summary,
    details,
    errors,
  });
}
