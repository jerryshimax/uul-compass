/**
 * POST /api/ai/tool/execute — Execute a confirmed WRITE tool call
 *
 * David's client UI calls this AFTER the user clicks "Confirm" on a
 * pending tool call card in the chat. Auto-executed READ tools do not
 * go through this endpoint — they run inline during the chat stream.
 *
 * Flow:
 *   1. Authenticate user (Supabase session)
 *   2. Validate tool name + args (zod schema from tools.ts)
 *   3. Check permission (entity access, role)
 *   4. Execute the tool (runs Drizzle mutation)
 *   5. Log to ai_tool_calls (audit trail)
 *   6. Return result so client can append a "tool" message and continue
 *      the conversation with the LLM
 *
 * Request body:
 *   {
 *     conversationId: string (required)
 *     messageId?: string (optional — the assistant message that issued the tool call)
 *     toolCallId: string (required — unique id from the AI SDK tool call)
 *     toolName: string (required — from WRITE_EXECUTORS)
 *     args: object (required — possibly edited by user from original AI draft)
 *     originalArgs?: object (optional — pre-edit args, for audit)
 *   }
 *
 * Response:
 *   { ok: true, toolCallId, result, citations? }
 *   { ok: false, error }
 *
 * David's client pattern:
 *   // user clicks Confirm on a ToolCard
 *   const res = await fetch("/api/ai/tool/execute", {
 *     method: "POST",
 *     headers: { "content-type": "application/json" },
 *     body: JSON.stringify({ conversationId, toolCallId, toolName, args }),
 *   }).then(r => r.json());
 *
 *   // then continue the chat with the result
 *   // sendMessage({ role: "tool", tool_call_id: toolCallId, content: res.result });
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { getTool } from "@/lib/ai/tools";
import { WRITE_EXECUTORS, type WriteToolName } from "@/lib/ai/tool-executors";
import { db } from "@/db";
import { aiToolCalls } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

type ToolExecuteBody = {
  conversationId: string;
  messageId?: string;
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  originalArgs?: Record<string, unknown>;
};

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  const log = (
    level: "info" | "warn" | "error",
    event: string,
    fields: Record<string, unknown> = {},
  ) => {
    console[level](
      JSON.stringify({
        requestId,
        route: "/api/ai/tool/execute",
        event,
        elapsedMs: Date.now() - startedAt,
        ...fields,
      }),
    );
  };

  const user = await getCurrentUser();
  if (!user) {
    log("warn", "unauthorized");
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: ToolExecuteBody;
  try {
    body = (await req.json()) as ToolExecuteBody;
  } catch (err) {
    log("error", "invalid_body", { message: (err as Error).message });
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { conversationId, messageId, toolCallId, toolName, args, originalArgs } = body;

  if (!conversationId || !toolCallId || !toolName || !args) {
    log("warn", "missing_fields", {
      hasConversationId: !!conversationId,
      hasToolCallId: !!toolCallId,
      hasToolName: !!toolName,
      hasArgs: !!args,
    });
    return Response.json(
      { ok: false, error: "Missing required fields: conversationId, toolCallId, toolName, args" },
      { status: 400 },
    );
  }

  // ─── Resolve tool definition ────────────────────────────────
  const toolDef = getTool(toolName);
  if (!toolDef) {
    log("warn", "unknown_tool", { toolName });
    return Response.json(
      { ok: false, error: `Unknown tool: ${toolName}` },
      { status: 400 },
    );
  }

  if (toolDef.category === "read") {
    log("warn", "read_tool_via_execute", { toolName });
    return Response.json(
      { ok: false, error: "READ tools execute inline during chat stream, not via this endpoint" },
      { status: 400 },
    );
  }

  // ─── Validate args via zod schema ───────────────────────────
  const parsed = toolDef.schema.safeParse(args);
  if (!parsed.success) {
    log("warn", "invalid_args", {
      toolName,
      issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
    });
    return Response.json(
      { ok: false, error: "Invalid args", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // ─── Find executor ──────────────────────────────────────────
  const executor = WRITE_EXECUTORS[toolName as WriteToolName];
  if (!executor) {
    log("error", "executor_not_implemented", { toolName });
    return Response.json(
      {
        ok: false,
        error: `Executor not yet implemented for ${toolName}. Tool is defined but lacks a server-side handler.`,
      },
      { status: 501 },
    );
  }

  // ─── Audit: record pending tool call ────────────────────────
  const [auditRow] = await db
    .insert(aiToolCalls)
    .values({
      conversationId,
      messageId: messageId ?? null,
      userId: user.id,
      toolName,
      args: parsed.data,
      argsEdited: originalArgs && JSON.stringify(originalArgs) !== JSON.stringify(parsed.data)
        ? parsed.data
        : null,
      status: "confirmed",
      confirmedAt: new Date(),
    })
    .returning({ id: aiToolCalls.id });

  log("info", "tool_call_confirmed", {
    toolName,
    userId: user.id,
    toolCallId,
    auditId: auditRow.id,
  });

  // ─── Execute ────────────────────────────────────────────────
  try {
    // Type-unsafe cast here because each executor has a distinct arg type.
    // The zod schema above already validated the shape.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (executor as any)(parsed.data, {
      user,
      conversationId,
      messageId,
    });

    // Update audit row with execution result
    await db
      .update(aiToolCalls)
      .set({
        status: result.ok ? "executed" : "failed",
        result: result as unknown as Record<string, unknown>,
        error: result.ok ? null : result.error ?? "Unknown executor error",
        executedAt: new Date(),
        affectedEntityType: extractAffectedType(toolName),
        affectedEntityId: extractAffectedId(result),
      })
      .where(eq(aiToolCalls.id, auditRow.id));

    log(result.ok ? "info" : "error", result.ok ? "tool_executed" : "tool_failed", {
      toolName,
      auditId: auditRow.id,
      ok: result.ok,
    });

    return Response.json({
      ok: result.ok,
      requestId,
      toolCallId,
      result: result.ok ? result.data : undefined,
      citations: result.citations,
      error: result.ok ? undefined : result.error,
    });
  } catch (err) {
    const message = (err as Error).message;
    log("error", "tool_exception", { toolName, auditId: auditRow.id, message });

    // Mark failed in audit
    try {
      await db
        .update(aiToolCalls)
        .set({ status: "failed", error: message, executedAt: new Date() })
        .where(eq(aiToolCalls.id, auditRow.id));
    } catch {
      /* ignore — audit write shouldn't mask the real error */
    }

    return Response.json(
      { ok: false, requestId, toolCallId, error: message },
      { status: 500 },
    );
  }
}

// ─── Helpers to derive affected-entity info for audit ──────────
function extractAffectedType(toolName: string): string | null {
  const map: Record<string, string> = {
    create_task: "task",
    update_task: "task",
    create_risk: "risk",
    update_risk: "risk",
    log_decision: "decision",
    create_opportunity: "opportunity",
    update_opportunity_stage: "opportunity",
    log_demand_signal: "demand_signal",
    draft_handoff: "handoff",
    update_office_status: "office_status",
    watch_entity: "watch",
  };
  return map[toolName] ?? null;
}

function extractAffectedId(result: { ok: boolean; data?: unknown }): string | null {
  if (!result.ok || !result.data || typeof result.data !== "object") return null;
  const d = result.data as Record<string, string>;
  return (
    d.taskId ??
    d.riskId ??
    d.opportunityId ??
    d.demandSignalId ??
    d.handoffId ??
    d.decisionId ??
    null
  );
}
