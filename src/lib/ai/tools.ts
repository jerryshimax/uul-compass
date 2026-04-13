/**
 * AI Tool Definitions
 *
 * Tools the LLM can call. Every tool:
 *   1. Has a clear, user-facing description (shown in Confirm dialog)
 *   2. Validates input with zod
 *   3. Checks user permissions via getCurrentUser() + requireEntityAccess()
 *   4. Reads/writes via existing Drizzle data layer (not raw SQL)
 *   5. Logs to ai_tool_calls for audit
 *
 * Rules:
 *   - READ tools execute immediately (no confirmation). Safe: just fetches data user is allowed to see.
 *   - WRITE tools return a "pending" result that the UI renders as a Confirm/Edit/Cancel card.
 *     Only after user confirms does the actual mutation execute.
 *
 * David: wire the confirmation flow in `src/components/ai/tool-card.tsx`. When user
 * confirms, POST to `/api/ai/tool/execute` with the tool call id + args.
 */

import { z } from "zod";
// Stub: actual tool() import once ai@^6.0.0 installed
// import { tool } from "ai";

import type { CurrentUser } from "@/lib/supabase/get-current-user";

// ─── Tool Categories ───────────────────────────────────────────
// Used by the UI to style confirmation cards appropriately.
export const TOOL_CATEGORY = {
  READ: "read", // auto-execute, no confirm
  WRITE: "write", // always confirm before execute
  WORKFLOW: "workflow", // creates/moves handoffs, opportunities — critical path
} as const;

export type ToolCategory = typeof TOOL_CATEGORY[keyof typeof TOOL_CATEGORY];

// ─── Tool metadata for UI rendering ────────────────────────────
export type ToolMeta = {
  category: ToolCategory;
  displayName: string;            // shown in the Confirm card
  displayNameZh?: string;         // Chinese display name
  summaryTemplate: (args: unknown) => string; // "Compass wants to: create a task for John"
  icon?: string;                  // lucide-react icon name
};

// ─── READ TOOLS ────────────────────────────────────────────────
// Execute without confirmation. Entity scoping enforced via WHERE clauses.

export const queryTasksSchema = z.object({
  status: z.enum(["todo", "in_progress", "blocked", "review", "done"]).optional(),
  assigneeId: z.string().uuid().optional(),
  workstreamId: z.string().uuid().optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const queryRisksSchema = z.object({
  severity: z.enum(["high", "medium", "low"]).optional(),
  status: z.enum(["open", "mitigating", "resolved"]).optional(),
  ownerId: z.string().uuid().optional(),
  workstreamId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const queryOpportunitiesSchema = z.object({
  stage: z.enum(["lead", "qualified", "quoted", "negotiating", "won", "lost"]).optional(),
  salespersonId: z.string().uuid().optional(),
  customerName: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const queryDemandSignalsSchema = z.object({
  lane: z.string().optional(), // "Shanghai-LA", "Qingdao-LGB", etc.
  commodity: z.string().optional(),
  confidence: z.enum(["low", "medium", "high"]).optional(),
  monthFilter: z
    .string()
    .refine((s) => /^[0-9]{4}[-][0-9]{2}$/.test(s), {
      message: "monthFilter must be YYYY followed by month, e.g., 2026 dash 05",
    })
    .optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const queryCarrierContractsSchema = z.object({
  carrier: z.string().optional(),
  lane: z.string().optional(),
  status: z.enum(["in_negotiation", "active", "expired", "terminated"]).optional(),
  utilizationAbove: z.number().min(0).max(100).optional(), // e.g., 80 = contracts >80% used
});

export const queryBrainSchema = z.object({
  query: z.string().min(2).describe("Natural-language search query"),
  sourceTypes: z.array(z.enum([
    "brain_file", "meeting_note", "pmi_task", "risk", "decision",
    "opportunity", "demand_signal", "carrier_contract",
  ])).optional(),
  limit: z.number().int().min(1).max(20).default(8),
});

export const findMeetingSchema = z.object({
  query: z.string().describe("Topic, attendee name, or date reference"),
  dateRange: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional(),
  meetingType: z.enum(["board", "leadership", "department", "strategy"]).optional(),
  limit: z.number().int().min(1).max(20).default(5),
});

export const queryHandoffsSchema = z.object({
  status: z.enum(["sent", "seen", "acknowledged", "in_progress", "completed", "declined"]).optional(),
  direction: z.enum(["incoming", "outgoing", "both"]).default("both"),
  urgency: z.enum(["low", "medium", "high", "urgent"]).optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

// ─── WRITE TOOLS ───────────────────────────────────────────────
// Always confirmed by the user before execution.

export const createTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  workstreamId: z.string().uuid().describe("Which workstream this task belongs to"),
  assigneeId: z.string().uuid().optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  dueDate: z.string().optional().describe("ISO date YYYY-MM-DD"),
  phase: z.number().int().min(1).max(3).optional(),
  entityId: z.string().uuid().describe("Must be in user's accessibleEntityIds"),
});

export const updateTaskSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["todo", "in_progress", "blocked", "review", "done"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export const createRiskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  severity: z.enum(["high", "medium", "low"]),
  ownerId: z.string().uuid().optional(),
  workstreamId: z.string().uuid().optional(),
  mitigationPlan: z.string().optional(),
  targetDate: z.string().optional(),
  entityId: z.string().uuid(),
});

export const updateRiskSchema = z.object({
  riskId: z.string().uuid(),
  severity: z.enum(["high", "medium", "low"]).optional(),
  status: z.enum(["open", "mitigating", "resolved"]).optional(),
  mitigationPlan: z.string().optional(),
  notes: z.string().optional(),
});

export const logDecisionSchema = z.object({
  title: z.string().min(3),
  decision: z.string().min(10).describe("What was decided"),
  rationale: z.string().optional(),
  decidedBy: z.string().uuid().optional().describe("User ID of decider, defaults to current user"),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().uuid().optional(),
  entityId: z.string().uuid(),
});

export const createOpportunitySchema = z.object({
  customerName: z.string().min(2),
  description: z.string().optional(),
  salespersonId: z.string().uuid().optional().describe("Defaults to current user"),
  stage: z.enum(["lead", "qualified", "quoted", "negotiating", "won", "lost"]).default("lead"),
  expectedValueCents: z.number().int().optional().describe("In cents, e.g., $2M = 200_000_000"),
  expectedCloseDate: z.string().optional(),
  lane: z.string().optional().describe("e.g., Shanghai-LA"),
  commodity: z.string().optional(),
  volumeTeu: z.number().int().positive().optional(),
  entityId: z.string().uuid(),
});

export const updateOpportunityStageSchema = z.object({
  opportunityId: z.string().uuid(),
  newStage: z.enum(["lead", "qualified", "quoted", "negotiating", "won", "lost"]),
  notes: z.string().optional(),
});

export const logDemandSignalSchema = z.object({
  lane: z.string().describe("Origin-destination pair, e.g., Shanghai-LA"),
  commodity: z.string().optional(),
  customerName: z.string().optional(),
  salespersonId: z.string().uuid().optional().describe("Defaults to current user"),
  expectedVolumeTeu: z.number().int().positive(),
  expectedStartDate: z.string().describe("When the volume starts: YYYY-MM or YYYY-MM-DD"),
  confidence: z.enum(["low", "medium", "high"]),
  notes: z.string().optional(),
  entityId: z.string().uuid(),
});

export const draftHandoffSchema = z.object({
  toUserId: z.string().uuid().optional().describe("Specific recipient user"),
  toDepartment: z.enum([
    "sales", "customer_service", "procurement", "operations",
    "finance", "compliance", "it", "leadership",
  ]).optional().describe("If no specific user, route to a department"),
  subject: z.string().min(3),
  context: z.string().min(10).describe("Background — what needs to be known"),
  requestedAction: z.string().min(5).describe("What specifically needs to happen"),
  urgency: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueBy: z.string().optional().describe("ISO date"),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().uuid().optional(),
});

export const updateOfficeStatusSchema = z.object({
  officeId: z.string().uuid(),
  currentFocus: z.string().describe("What the office is working on right now"),
  capacityIndicator: z.enum(["green", "yellow", "red"]),
  blockers: z.string().optional(),
});

export const watchEntitySchema = z.object({
  targetType: z.string().describe("e.g., task, risk, opportunity, handoff"),
  targetId: z.string().uuid(),
  watchType: z.enum(["any_change", "major_only", "mentions_only"]).default("any_change"),
});

// ─── Tool Registry ─────────────────────────────────────────────
// Central map of tool name → { category, metadata, schema, executor }
// The RAG endpoint iterates this to build the tools array passed to the LLM.

export type ToolDefinition = {
  name: string;
  description: string; // shown to the LLM — be specific about when to use
  category: ToolCategory;
  schema: z.ZodSchema;
  meta: ToolMeta;
};

export const AI_TOOLS: ToolDefinition[] = [
  // READ
  {
    name: "query_tasks",
    description: "List tasks filtered by status, assignee, workstream, or priority. Use when user asks 'show me tasks', 'what's overdue', etc.",
    category: "read",
    schema: queryTasksSchema,
    meta: {
      category: "read",
      displayName: "Search tasks",
      displayNameZh: "搜索任务",
      summaryTemplate: () => "Fetching tasks",
    },
  },
  {
    name: "query_risks",
    description: "List risks filtered by severity, status, owner, or workstream. Use when user asks about risks, issues, blockers.",
    category: "read",
    schema: queryRisksSchema,
    meta: {
      category: "read",
      displayName: "Search risks",
      displayNameZh: "搜索风险",
      summaryTemplate: () => "Fetching risks",
    },
  },
  {
    name: "query_opportunities",
    description: "List sales opportunities filtered by stage, salesperson, or customer. Use for pipeline queries.",
    category: "read",
    schema: queryOpportunitiesSchema,
    meta: {
      category: "read",
      displayName: "Search opportunities",
      displayNameZh: "搜索商机",
      summaryTemplate: () => "Fetching opportunities",
    },
  },
  {
    name: "query_demand_signals",
    description: "List demand signals from sales. Use to understand forward-looking capacity needs by lane/month.",
    category: "read",
    schema: queryDemandSignalsSchema,
    meta: {
      category: "read",
      displayName: "Search demand signals",
      displayNameZh: "搜索需求信号",
      summaryTemplate: () => "Fetching demand signals",
    },
  },
  {
    name: "query_carrier_contracts",
    description: "List carrier service contracts and their MQC utilization. Use to check if a lane has contract coverage.",
    category: "read",
    schema: queryCarrierContractsSchema,
    meta: {
      category: "read",
      displayName: "Search carrier contracts",
      displayNameZh: "搜索承运商合同",
      summaryTemplate: () => "Fetching carrier contracts",
    },
  },
  {
    name: "query_brain",
    description: "Semantic search across the UUL Brain knowledge base (meetings, research, decks, legal, strategy). Use for historical or contextual questions — ALWAYS use this instead of guessing when the user asks about past events, customers, or internal knowledge.",
    category: "read",
    schema: queryBrainSchema,
    meta: {
      category: "read",
      displayName: "Search UUL Brain",
      displayNameZh: "搜索知识库",
      summaryTemplate: (args) => `Searching Brain for: "${(args as { query: string }).query}"`,
    },
  },
  {
    name: "find_meeting",
    description: "Find a specific meeting by topic, attendee, or date. Returns meeting notes with decisions.",
    category: "read",
    schema: findMeetingSchema,
    meta: {
      category: "read",
      displayName: "Find meeting",
      displayNameZh: "查找会议",
      summaryTemplate: (args) => `Finding meeting: "${(args as { query: string }).query}"`,
    },
  },
  {
    name: "query_handoffs",
    description: "List handoffs — incoming (needing your response) or outgoing (sent by you). Use when user asks 'what do I need to respond to'.",
    category: "read",
    schema: queryHandoffsSchema,
    meta: {
      category: "read",
      displayName: "Search handoffs",
      displayNameZh: "搜索交接",
      summaryTemplate: () => "Fetching handoffs",
    },
  },

  // WRITE
  {
    name: "create_task",
    description: "Create a new PMI task. Use when user says 'create a task for X to do Y by Z'.",
    category: "write",
    schema: createTaskSchema,
    meta: {
      category: "write",
      displayName: "Create task",
      displayNameZh: "创建任务",
      summaryTemplate: (args) => {
        const a = args as z.infer<typeof createTaskSchema>;
        return `Create task: "${a.title}"${a.dueDate ? ` due ${a.dueDate}` : ""}`;
      },
      icon: "plus-circle",
    },
  },
  {
    name: "update_task",
    description: "Update a task's status, priority, assignee, due date, progress, or notes.",
    category: "write",
    schema: updateTaskSchema,
    meta: {
      category: "write",
      displayName: "Update task",
      displayNameZh: "更新任务",
      summaryTemplate: (args) => `Update task ${(args as { taskId: string }).taskId.slice(0, 8)}…`,
      icon: "edit",
    },
  },
  {
    name: "create_risk",
    description: "Create a new risk entry in the risk register.",
    category: "write",
    schema: createRiskSchema,
    meta: {
      category: "write",
      displayName: "Create risk",
      displayNameZh: "创建风险",
      summaryTemplate: (args) => {
        const a = args as z.infer<typeof createRiskSchema>;
        return `Create ${a.severity} risk: "${a.title}"`;
      },
      icon: "alert-triangle",
    },
  },
  {
    name: "update_risk",
    description: "Update a risk's severity, status, mitigation plan, or notes.",
    category: "write",
    schema: updateRiskSchema,
    meta: {
      category: "write",
      displayName: "Update risk",
      displayNameZh: "更新风险",
      summaryTemplate: () => "Update risk",
      icon: "edit",
    },
  },
  {
    name: "log_decision",
    description: "Log a decision in the Decisions audit trail. Use when user says 'we decided X' or 'approve X'.",
    category: "write",
    schema: logDecisionSchema,
    meta: {
      category: "write",
      displayName: "Log decision",
      displayNameZh: "记录决定",
      summaryTemplate: (args) => `Log decision: "${(args as z.infer<typeof logDecisionSchema>).title}"`,
      icon: "gavel",
    },
  },
  {
    name: "create_opportunity",
    description: "Create a new sales opportunity. Use when salesperson describes a deal ('met with ACME, $2M deal, Shanghai-LA, 500 TEU').",
    category: "workflow",
    schema: createOpportunitySchema,
    meta: {
      category: "workflow",
      displayName: "Create opportunity",
      displayNameZh: "创建商机",
      summaryTemplate: (args) => {
        const a = args as z.infer<typeof createOpportunitySchema>;
        const value = a.expectedValueCents ? ` ($${(a.expectedValueCents / 100).toLocaleString()})` : "";
        return `Create opportunity: ${a.customerName}${value}`;
      },
      icon: "briefcase",
    },
  },
  {
    name: "update_opportunity_stage",
    description: "Move an opportunity through pipeline stages.",
    category: "workflow",
    schema: updateOpportunityStageSchema,
    meta: {
      category: "workflow",
      displayName: "Move opportunity stage",
      displayNameZh: "更新商机阶段",
      summaryTemplate: (args) => {
        const a = args as z.infer<typeof updateOpportunityStageSchema>;
        return `Move opportunity to: ${a.newStage}`;
      },
      icon: "arrow-right-circle",
    },
  },
  {
    name: "log_demand_signal",
    description: "Log a forward-looking demand signal from sales. Feeds the fulfillment capacity view.",
    category: "workflow",
    schema: logDemandSignalSchema,
    meta: {
      category: "workflow",
      displayName: "Log demand signal",
      displayNameZh: "记录需求信号",
      summaryTemplate: (args) => {
        const a = args as z.infer<typeof logDemandSignalSchema>;
        return `Log demand: ${a.expectedVolumeTeu} TEU ${a.lane} starting ${a.expectedStartDate}`;
      },
      icon: "trending-up",
    },
  },
  {
    name: "draft_handoff",
    description: "Create a structured handoff to another person or department. Use this whenever work needs to cross functions — NEVER just reply with 'tell them X'.",
    category: "workflow",
    schema: draftHandoffSchema,
    meta: {
      category: "workflow",
      displayName: "Draft handoff",
      displayNameZh: "起草交接",
      summaryTemplate: (args) => {
        const a = args as z.infer<typeof draftHandoffSchema>;
        const target = a.toDepartment ?? "selected user";
        return `Hand off to ${target}: "${a.subject}"`;
      },
      icon: "send",
    },
  },
  {
    name: "update_office_status",
    description: "Update the live status of an office (current focus, capacity, blockers).",
    category: "write",
    schema: updateOfficeStatusSchema,
    meta: {
      category: "write",
      displayName: "Update office status",
      displayNameZh: "更新办公室状态",
      summaryTemplate: () => "Update office status",
      icon: "building-2",
    },
  },
  {
    name: "watch_entity",
    description: "Follow an entity to receive notifications when it changes.",
    category: "write",
    schema: watchEntitySchema,
    meta: {
      category: "write",
      displayName: "Watch",
      displayNameZh: "关注",
      summaryTemplate: () => "Watch this entity",
      icon: "eye",
    },
  },
];

// ─── Helper: lookup by name ────────────────────────────────────
export function getTool(name: string): ToolDefinition | undefined {
  return AI_TOOLS.find((t) => t.name === name);
}

// ─── Permission gate for a tool call ───────────────────────────
/**
 * Validates that the current user is permitted to invoke a given tool
 * with given args. Throws on violation.
 *
 * Enforcement rules:
 *   - Viewer-only users: read tools only
 *   - If args include `entityId`, must be in user.accessibleEntityIds
 *   - Write tools require "full" access on the target entity
 */
export function checkToolPermission(
  user: CurrentUser,
  toolName: string,
  args: Record<string, unknown>,
): void {
  const tool = getTool(toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  // Viewers can only read
  if (tool.category !== "read" && !user.isContributor && !user.isAdmin) {
    throw new Error(
      `User ${user.email} (role: ${user.role}) cannot invoke write tool: ${toolName}`,
    );
  }

  // Entity scoping for tools that target a specific entity
  const entityId = args.entityId as string | undefined;
  if (entityId && !user.accessibleEntityIds.includes(entityId)) {
    throw new Error(
      `Access denied: user ${user.email} cannot access entity ${entityId}`,
    );
  }
}
