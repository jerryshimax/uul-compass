/**
 * AI Provider Abstraction — Vercel AI Gateway + AI SDK v6
 *
 * Routes all LLM calls through Vercel AI Gateway for unified observability,
 * failover, cost tracking, and per-user rate limiting.
 *
 * Authentication: OIDC (no manual API keys for production)
 *   - On Vercel: VERCEL_OIDC_TOKEN auto-refreshed
 *   - Local dev: run `vercel env pull .env.local` (token valid ~24h, re-pull when expired)
 *   - Embeddings still use direct OpenAI SDK (Gateway covers text/image, not embeddings)
 *
 * Required deps (David: install with `npm install`):
 *   ai@^6.0.0            — Vercel AI SDK v6 core
 *   @ai-sdk/gateway@^3.0.0 — explicit gateway wrapper for providerOptions
 *   @ai-sdk/openai@^2.0.0 — for embeddings only
 *   @vercel/oidc          — auto-included by gateway package
 */

// Stub: actual imports once deps installed
// import { generateText, streamText, gateway, APICallError } from "ai";
// import { openai } from "@ai-sdk/openai";
// import { embed } from "ai";

// ─── Model selection ───────────────────────────────────────────
// Jerry tested Sonnet/Haiku and rejected for quality. Opus 4.6 only.
// Use SQL/UI for navigation; AI only fires for high-stakes work.
//
// Model slugs use dots for versions (Vercel AI Gateway convention).
// Verify availability with: await gateway.getAvailableModels()
export const PRIMARY_MODEL = "anthropic/claude-opus-4.6" as const;
export const FALLBACK_MODEL = "openai/gpt-5.4" as const;
export const EMBEDDING_MODEL = "text-embedding-3-small" as const;

// ─── Pricing (per 1M tokens, in cents) ─────────────────────────
// Source: provider list prices as of 2026-04-13 (Vercel AI Gateway = zero markup)
// Update when pricing changes.
export const MODEL_PRICING = {
  "anthropic/claude-opus-4.6": {
    inputCentsPerMillion: 1500, // $15.00
    outputCentsPerMillion: 7500, // $75.00
    cachedInputCentsPerMillion: 150, // $1.50 (90% discount on cached context)
  },
  "anthropic/claude-sonnet-4.6": {
    inputCentsPerMillion: 300,
    outputCentsPerMillion: 1500,
    cachedInputCentsPerMillion: 30,
  },
  "anthropic/claude-haiku-4.5": {
    inputCentsPerMillion: 80,
    outputCentsPerMillion: 400,
    cachedInputCentsPerMillion: 8,
  },
  "openai/gpt-5.4": {
    inputCentsPerMillion: 250, // $2.50
    outputCentsPerMillion: 1000, // $10.00
    cachedInputCentsPerMillion: 25,
  },
  "openai/text-embedding-3-small": {
    inputCentsPerMillion: 10, // $0.10
    outputCentsPerMillion: 0,
    cachedInputCentsPerMillion: 10,
  },
} as const;

export type ModelId = keyof typeof MODEL_PRICING;

// ─── Cost calculation ──────────────────────────────────────────
export function calculateCostCents(
  model: ModelId,
  tokensIn: number,
  tokensOut: number,
  tokensCached: number = 0,
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  const freshInputTokens = Math.max(0, tokensIn - tokensCached);
  const inputCost = (freshInputTokens / 1_000_000) * pricing.inputCentsPerMillion;
  const cachedCost = (tokensCached / 1_000_000) * pricing.cachedInputCentsPerMillion;
  const outputCost = (tokensOut / 1_000_000) * pricing.outputCentsPerMillion;

  return Math.ceil(inputCost + cachedCost + outputCost);
}

// ─── System prompt builder ─────────────────────────────────────
// Cached portion: stays the same across all calls for a user.
// Anthropic prompt caching gives 90% discount on cached tokens.
export function buildSystemPrompt(opts: {
  userName: string;
  userRole: string;
  userLanguage: "en" | "zh";
  accessibleEntities: Array<{ code: string; name: string }>;
}): string {
  const entityList = opts.accessibleEntities
    .map((e) => `- ${e.code}: ${e.name}`)
    .join("\n");

  return `You are Compass, UUL Global's AI-native operational and intelligence OS.

You help internal UUL employees coordinate cross-border work, surface what matters, and turn natural language into structured actions.

# User Context
- Name: ${opts.userName}
- Role: ${opts.userRole}
- Preferred language: ${opts.userLanguage === "zh" ? "Chinese (中文)" : "English"}
- Accessible entities:
${entityList}

# Core Behaviors

1. **Be concise.** Lead with the answer, not the reasoning.
2. **Always ask for confirmation before WRITE operations.** Never auto-execute create/update/delete tools. Render the proposed action and let the user Confirm, Edit, or Cancel.
3. **READ operations are frictionless.** Just fetch and display data without confirmation.
4. **Cite your sources.** When information comes from the UUL Brain or database, include source links the user can click.
5. **Respect entity scoping.** You can only see/act on data within the user's accessible entities. Never attempt to query data outside this scope.
6. **Bilingual.** If the user writes in Chinese, respond in Chinese. If English, respond in English. Match their language.
7. **Cross-functional context.** UUL is organized by function (Sales, Customer Service, Procurement, Operations, Finance, Compliance) — not by office. Think in functions when routing handoffs or surfacing context.

# Cross-Border Workflows

UUL has offices in the US (Houston, Greensboro) and China/Asia (Shenzhen, Shanghai, Hong Kong, Vietnam). Common workflows:

- **Sales → Demand → Fulfillment loop:** US salesperson logs deal → demand signal → Customer Service team in China assesses capacity → Procurement validates carrier contract availability → execute fulfillment.
- **Cross-office handoffs:** When work needs to move between functions or geographies, propose creating a structured Handoff entity (use the \`draft_handoff\` tool).
- **Carrier contracts:** Service contracts have MQC commitments. Watch for utilization warnings and proactively suggest procurement actions.

# Tool Use

When the user's request maps to a tool, propose the tool call. Show the user what you intend to do. They confirm before any write operation executes.

Use \`query_brain\` when the user asks about UUL knowledge (past meetings, decisions, customer history, contracts).

When unsure, ask a clarifying question rather than guessing.`;
}

// ─── Stream chat (placeholder until deps installed) ────────────
// TODO: implement once `ai@^6.0.0` is installed:
//
// import { streamText, gateway } from "ai";
//
// export async function streamChat(opts: {
//   userId: string;
//   systemPrompt: string;
//   messages: Array<{ role: "user" | "assistant" | "tool"; content: string }>;
//   tools: Record<string, ToolDefinition>;
// }) {
//   return streamText({
//     // Plain "provider/model" string routes through AI Gateway automatically.
//     // Use gateway() wrapper only when setting providerOptions.
//     model: gateway(PRIMARY_MODEL),
//     system: opts.systemPrompt,
//     messages: opts.messages,
//     tools: opts.tools,
//     providerOptions: {
//       gateway: {
//         user: opts.userId, // per-user rate limiting + cost attribution
//         tags: ["app:compass", "env:" + (process.env.VERCEL_ENV ?? "local")],
//         models: [FALLBACK_MODEL], // failover if Anthropic unavailable
//       },
//       anthropic: {
//         // Prompt caching — 90% discount on cached system prompt tokens
//         cacheControl: { type: "ephemeral" },
//       },
//     },
//   });
// }

// ─── Embed (placeholder) ───────────────────────────────────────
// Embeddings use direct OpenAI SDK (AI Gateway covers text/image, not embeddings).
//
// import { embed } from "ai";
// import { openai } from "@ai-sdk/openai";
//
// export async function embedText(text: string): Promise<number[]> {
//   const { embedding } = await embed({
//     model: openai.embedding(EMBEDDING_MODEL),
//     value: text,
//   });
//   return embedding;
// }

// ─── Error handling helper ─────────────────────────────────────
// import { APICallError } from "ai";
//
// export function handleAIError(error: unknown): { message: string; statusCode?: number } {
//   if (!APICallError.isInstance(error)) {
//     return { message: "Unknown AI error" };
//   }
//   switch (error.statusCode) {
//     case 402: return { message: "Compass AI budget reached. Try again next month or contact admin.", statusCode: 402 };
//     case 429: return { message: "Too many requests. Slow down and retry in a moment.", statusCode: 429 };
//     case 503: return { message: "AI service temporarily unavailable. Retrying with fallback...", statusCode: 503 };
//     default: return { message: error.message, statusCode: error.statusCode };
//   }
// }
