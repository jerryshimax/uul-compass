import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { conversations, chatMessages } from "@/db/schema/ai";
import { users } from "@/db/schema/org";
import { eq } from "drizzle-orm";
import { buildSystemPrompt, type PageContext } from "@/lib/ai/system-prompt";
import { compassTools } from "@/lib/ai/tools";
import { handleToolCall } from "@/lib/ai/tool-handlers";
import {
  getTasks,
  getTaskById,
  getWorkstreams,
  getRisks,
  getValueInitiatives,
  getGates,
  getTaskStats,
  getNeedsAttention,
  getTaskMeetings,
  getTaskActivities,
} from "@/lib/data";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function sse(event: object): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { conversationId, message, pageContext, attachments }: {
    conversationId?: string;
    message: string;
    pageContext: PageContext;
    attachments?: Array<{ url: string; filename: string; contentType: string }>;
  } = body;

  // ── User role ─────────────────────────────────────────────────────────
  const userRecord = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.authId, user.id))
    .limit(1)
    .then((r) => r[0] ?? null);
  const userRole = userRecord?.role ?? "viewer";
  const userId = userRecord?.id ?? user.id;

  // ── Page-specific context data ────────────────────────────────────────
  const compassData: Record<string, any> = {};
  const { entityType, entityId } = pageContext;
  try {
    if (entityType === "task" && entityId) {
      const [task, meetings, activities] = await Promise.all([
        getTaskById(entityId),
        getTaskMeetings(entityId),
        getTaskActivities(entityId),
      ]);
      compassData.currentTask = task;
      compassData.taskMeetings = meetings;
      compassData.taskActivities = activities;
    } else if (entityType === "plan" || entityType === "dashboard") {
      const [tasks, workstreams, stats, attention] = await Promise.all([
        getTasks(),
        getWorkstreams(),
        getTaskStats(),
        getNeedsAttention(),
      ]);
      compassData.tasks = tasks;
      compassData.workstreams = workstreams;
      compassData.taskStats = stats;
      compassData.needsAttention = attention;
    } else if (entityType === "risks") {
      compassData.risks = await getRisks();
    } else if (entityType === "initiatives") {
      compassData.initiatives = await getValueInitiatives();
    } else if (entityType === "decisions") {
      compassData.gates = await getGates();
    }
  } catch { /* non-fatal */ }

  // ── Ensure conversation exists upfront (needed for staged message IDs) ─
  let convId = conversationId ?? null;
  if (!convId) {
    const [conv] = await db
      .insert(conversations)
      .values({ pageContext: pageContext as any, lastMessageAt: new Date() })
      .returning({ id: conversations.id });
    convId = conv.id;
  }

  // ── Load conversation history ─────────────────────────────────────────
  const history: Array<{ role: "user" | "assistant"; content: string }> = [];
  try {
    const msgs = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, convId))
      .orderBy(chatMessages.createdAt)
      .limit(30);
    for (const m of msgs) {
      if (m.role === "user" || m.role === "assistant") {
        history.push({ role: m.role, content: m.content ?? "" });
      }
    }
  } catch { /* non-fatal */ }

  // ── Build Claude messages ─────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(pageContext, compassData, userRole);

  const userContent: Anthropic.MessageParam["content"] = [
    { type: "text", text: message },
  ];
  if (attachments?.length) {
    for (const att of attachments) {
      userContent.push({
        type: "text",
        text: att.contentType.startsWith("image/")
          ? `[Image attached: ${att.filename}] (${att.url})`
          : `[File attached: ${att.filename}] (${att.url})`,
      });
    }
  }

  const claudeMessages: Anthropic.MessageParam[] = [
    ...history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
    { role: "user", content: userContent },
  ];

  // ── Save user message ─────────────────────────────────────────────────
  await db.insert(chatMessages).values({
    conversationId: convId,
    role: "user",
    content: message,
  }).catch(() => {});

  // ── Stream response ───────────────────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullAssistantText = "";

      const emit = (event: object) =>
        controller.enqueue(encoder.encode(sse(event)));

      try {
        let currentMessages = claudeMessages;

        // Agentic loop — keeps running until no more tool calls
        while (true) {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
            tools: compassTools,
            messages: currentMessages,
            stream: true,
          });

          const toolUseBlocks: Array<{
            type: "tool_use";
            id: string;
            name: string;
            input: any;
          }> = [];
          let curToolName = "";
          let curToolId = "";
          let curToolInput = "";

          for await (const event of response) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "tool_use") {
                curToolName = event.content_block.name;
                curToolId = event.content_block.id;
                curToolInput = "";
                emit({ type: "tool_use", name: curToolName });
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                fullAssistantText += event.delta.text;
                emit({ type: "text_delta", content: event.delta.text });
              } else if (event.delta.type === "input_json_delta") {
                curToolInput += event.delta.partial_json;
              }
            } else if (event.type === "content_block_stop" && curToolName) {
              let parsedInput: any = {};
              try { parsedInput = JSON.parse(curToolInput || "{}"); } catch {}
              toolUseBlocks.push({
                type: "tool_use",
                id: curToolId,
                name: curToolName,
                input: parsedInput,
              });
              curToolName = "";
              curToolId = "";
              curToolInput = "";
            }
          }

          // No tool calls → done
          if (toolUseBlocks.length === 0) break;

          // Execute tool calls
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const toolUse of toolUseBlocks) {
            const result = await handleToolCall(toolUse.name, toolUse.input, { userRole, userId });

            // If write tool was staged, persist + emit card event
            if (result.staged) {
              const [savedMsg] = await db
                .insert(chatMessages)
                .values({
                  conversationId: convId!,
                  role: "assistant",
                  content: "",
                  draftPayload: result.staged as any,
                  draftStatus: "pending",
                })
                .returning({ id: chatMessages.id });

              if (result.staged.kind === "confirm") {
                emit({
                  type: "confirm",
                  toolName: toolUse.name,
                  confirmId: savedMsg.id,
                  entityType: result.staged.entityType,
                  description: result.staged.description,
                  payload: result.staged.payload,
                });
              } else {
                emit({
                  type: "draft",
                  toolName: toolUse.name,
                  draftId: savedMsg.id,
                  entityType: result.staged.entityType,
                  description: result.staged.description,
                  payload: result.staged.payload,
                });
              }
            } else {
              emit({ type: "tool_result", name: toolUse.name, output: result.content });
            }

            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: result.content,
            });
          }

          currentMessages = [
            ...currentMessages,
            { role: "assistant" as const, content: toolUseBlocks },
            { role: "user" as const, content: toolResults },
          ];
        }

        // ── Persist assistant reply ───────────────────────────────────────
        if (fullAssistantText) {
          await db.insert(chatMessages).values({
            conversationId: convId!,
            role: "assistant",
            content: fullAssistantText,
            model: "claude-sonnet-4-6",
          }).catch(() => {});
        }

        await db
          .update(conversations)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversations.id, convId!))
          .catch(() => {});

        emit({ type: "done", conversationId: convId });
      } catch (err) {
        emit({ type: "error", message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
