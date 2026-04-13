/**
 * POST /api/ai/chat — Streaming RAG chat endpoint
 *
 * David's AI button UI (React, using @ai-sdk/react `useChat` hook) calls
 * this endpoint. Returns an AI SDK UIMessageStream that renders text,
 * tool calls, and citations.
 *
 * Flow:
 *   1. Authenticate user (Supabase session) → getCurrentUser()
 *   2. Build system prompt with user context + accessible entities
 *   3. Call streamText with:
 *      - Anthropic Claude Opus 4.6 via Vercel AI Gateway
 *      - READ tools with execute fn (auto-run during stream)
 *      - WRITE tools without execute (stream as pending for client confirmation)
 *   4. Stream back to client as UIMessageStream
 *   5. In background (waitUntil): persist conversation + message + cost
 *
 * Runtime: Node.js (pgvector queries use drizzle with postgres-js)
 *
 * Required deps (David install):
 *   ai@^6.0.0
 *   @ai-sdk/gateway@^3.0.0
 *   zod (already in tools.ts — may need explicit install)
 *
 * David's client (using AI SDK v6):
 *
 *   import { useChat } from "@ai-sdk/react";
 *   import { DefaultChatTransport } from "ai";
 *
 *   const { messages, sendMessage } = useChat({
 *     transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
 *     body: { pageContext: { route, visibleEntities } },
 *   });
 *
 *   // Render messages. For pending tool calls (no `result`), render the
 *   // Confirm/Edit/Cancel card. On Confirm, POST to /api/ai/tool/execute
 *   // and then append a "tool" role message with the result to continue.
 */

import { NextRequest } from "next/server";
// Real imports once deps installed — left as string to avoid TS errors before npm install
// import { streamText, convertToModelMessages, stepCountIs, tool } from "ai";
// import { gateway } from "ai";

import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { buildSystemPrompt, PRIMARY_MODEL, FALLBACK_MODEL } from "@/lib/ai/provider";
import { AI_TOOLS } from "@/lib/ai/tools";
import { READ_EXECUTORS, type ReadToolName } from "@/lib/ai/tool-executors";

export const runtime = "nodejs"; // AI SDK + pg + drizzle want Node runtime

type ChatRequestBody = {
  messages: unknown[]; // AI SDK v6 UIMessage[]
  id?: string; // conversation id (if continuing)
  pageContext?: {
    route: string;
    visibleEntities?: Array<{ type: string; id: string }>;
  };
};

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  // ─── Observability (structured logs, no message content) ────
  // Never log messages — they may contain PII, customer info, etc.
  // AI Gateway logs model calls separately in the Vercel dashboard.
  const log = (level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}) => {
    console[level](
      JSON.stringify({
        requestId,
        route: "/api/ai/chat",
        event,
        elapsedMs: Date.now() - startedAt,
        ...fields,
      }),
    );
  };

  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch (err) {
    log("error", "auth_failure", { message: (err as Error).message });
    return Response.json({ error: "Auth error" }, { status: 500 });
  }

  if (!user) {
    log("warn", "unauthorized");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.accessibleEntityIds.length === 0) {
    log("warn", "no_entity_access", { userId: user.id });
    return Response.json(
      { error: "No entity access. Contact an admin to be added to at least one entity." },
      { status: 403 },
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch (err) {
    log("error", "invalid_body", { message: (err as Error).message });
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const conversationId = body.id ?? null;

  log("info", "request_received", {
    userId: user.id,
    role: user.role,
    conversationId,
    messageCount: Array.isArray(body.messages) ? body.messages.length : 0,
    pageRoute: body.pageContext?.route,
    visibleEntityCount: body.pageContext?.visibleEntities?.length ?? 0,
  });

  // ─── Build the tools object for the SDK ─────────────────────
  // READ tools get an `execute` function — SDK runs them inline during stream.
  // WRITE tools omit execute — SDK streams them as pending tool calls that
  // the client UI renders as Confirm/Edit/Cancel cards.
  //
  // Pseudo-code for when `ai@^6.0.0` is installed:
  //
  //   const tools: Record<string, ReturnType<typeof tool>> = {};
  //   for (const def of AI_TOOLS) {
  //     if (def.category === "read") {
  //       tools[def.name] = tool({
  //         description: def.description,
  //         inputSchema: def.schema,
  //         execute: async (args) => {
  //           const executor = READ_EXECUTORS[def.name as ReadToolName];
  //           if (!executor) return { ok: false, error: `No executor for ${def.name}` };
  //           return executor(args as never, {
  //             user,
  //             conversationId,
  //           });
  //         },
  //       });
  //     } else {
  //       // write / workflow — no execute fn, client confirms
  //       tools[def.name] = tool({
  //         description: def.description,
  //         inputSchema: def.schema,
  //       });
  //     }
  //   }
  //
  //   const result = streamText({
  //     model: gateway(PRIMARY_MODEL),
  //     system: buildSystemPrompt({
  //       userName: user.fullName,
  //       userRole: user.role,
  //       userLanguage: "en", // TODO: pull from user preference
  //       accessibleEntities: user.entityAccess.map((a) => ({
  //         code: a.entityCode,
  //         name: a.entityName,
  //       })),
  //     }),
  //     messages: convertToModelMessages(body.messages),
  //     tools,
  //     stopWhen: stepCountIs(5), // max multi-step tool loop iterations
  //     providerOptions: {
  //       gateway: {
  //         user: user.id,
  //         tags: [
  //           "app:compass",
  //           `env:${process.env.NEXT_PUBLIC_COMPASS_ENV ?? "dev"}`,
  //           `role:${user.role}`,
  //         ],
  //         models: [FALLBACK_MODEL],
  //       },
  //       anthropic: {
  //         cacheControl: { type: "ephemeral" }, // 90% discount on cached context
  //       },
  //     },
  //     onFinish: async ({ usage, text }) => {
  //       // Persist message + cost in background so response streams fast
  //       // Use waitUntil for non-blocking persistence:
  //       //   import { after } from "next/server";
  //       //   after(persistConversationAndUsage({ user, conversationId, text, usage, pageContext: body.pageContext }));
  //     },
  //   });
  //
  //   return result.toUIMessageStreamResponse();

  // ─── Placeholder until deps installed ───────────────────────
  log("warn", "ai_sdk_not_installed", {
    hint: "Run: npm install ai@^6.0.0 @ai-sdk/gateway zod",
  });
  return Response.json(
    {
      error: "AI SDK not yet installed. Run: npm install ai@^6.0.0 @ai-sdk/gateway zod",
      requestId,
      stub: {
        user: { id: user.id, fullName: user.fullName },
        accessibleEntities: user.accessibleEntityCodes,
        messages: body.messages,
        pageContext: body.pageContext,
      },
    },
    { status: 501 },
  );
}
