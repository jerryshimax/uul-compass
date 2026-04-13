# Compass v1 — Build Plan & David Handoff

**Date:** 2026-04-13
**Sprint duration:** 10 days (3 sprints)
**Goal:** Ship Compass v1 to 10 internal UUL users for real-usage feedback

---

## Mission Statement

Compass is becoming **UUL Global's AI-native operational and intelligence OS** — a single source of truth that 30-100+ employees use to:
- Eliminate cross-department/cross-office mistrust through real-time visibility
- Capture sales pipeline → demand signals → fulfillment loop end-to-end
- Surface what matters via proactive AI insights
- Make every decision auditable and every handoff trackable

5-year thesis: Compass is the proprietary tech that makes UUL a more valuable acquisition target.

---

## Track A vs Track B

**Track A (NOW, 10 days):** Architectural foundations + AI core + cross-border workflows
**Track B (DEFERRED):** Enterprise security hardening (SSO, MFA, RLS enforcement, audit log activation, scoped API tokens, compliance docs, repo move to UUL org). Triggered when user count > 30, OR M&A starts, OR external advisors need access.

---

## Work Split (David ↔ Jerry's AI assistant)

### David owns
1. **Page-aware AI button** (Notion AI / Orbit-style) — bottom-right corner, slides up panel, knows current page/entity context. Coordinate API contract with Jerry.
2. **UI polish + responsive design** — continue mobile work, tablet breakpoint
3. **PWA setup** — manifest.json, service worker, "Add to Home Screen" prompt for iPhone
4. **Existing PMI features** — keep iterating on initiatives, decisions, risks, value gains pages
5. **DevOps / billing** (see Day 1 setup checklist below)

### Jerry's AI assistant (Claude) owns
1. **AI core backend** — provider abstraction, RAG endpoint, tool definitions, cost tracking
2. **New schemas** — handoffs, threads, watches, notifications, ai_*, sales, demand, contracts, feedback
3. **UUL Brain indexer** — local Node service watching `~/Work/[02] UUL Global/` and pushing embeddings to pgvector
4. **Pipeline page** — Sales/Demand/Fulfillment/Carrier Contracts unified
5. **Finance page scaffold**
6. **People page rework** (group by function, not office)
7. **Real-time hooks** — `useRealtime` factory using Supabase Realtime

### Both
- Code reviews on each other's PRs
- Daily 15-min sync (TG or call)
- Use feature branch `feature/v1-ai-os` to keep sprint work isolated from `main`

---

## Day 1 — David's Setup Checklist

These need to happen on day 1 so the rest of the work isn't blocked:

| # | Item | Why |
|---|------|-----|
| 1 | **Anthropic API account billed to UUL** | Production AI calls bill to UUL company card, not Jerry. Get API key, store in Vercel env as `ANTHROPIC_API_KEY`. Console: https://console.anthropic.com |
| 2 | **OpenAI API account for embeddings** | text-embedding-3-small at $0.10/1M tokens for vault embeddings. Bill to UUL. Store as `OPENAI_API_KEY`. |
| 3 | **Confirm Vercel project on UUL team** | Or transfer to UUL's Vercel team. Add UUL billing card. |
| 4 | **Confirm Supabase project on UUL billing** | Note: pgvector requires Pro tier ($25/mo) if not already on it. |
| 5 | **Set production env vars** in Vercel | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `COMPASS_BRAIN_PATH` (path to UUL Brain — used by indexer), `NEXT_PUBLIC_REALTIME_URL` |
| 6 | **Enable pgvector extension** on Supabase | Run `CREATE EXTENSION IF NOT EXISTS vector;` in Supabase SQL editor |
| 7 | **Domain pointing** | Point `compass.uulglobal.com` to Vercel project. Vercel auto-provisions SSL. |
| 8 | **Create feature branch** | `git checkout -b feature/v1-ai-os` from current `dev`. Push to remote. |

---

## Sprint 1 (Days 1-3): AI Core + UUL Brain

### Files Jerry's AI is creating

```
src/db/schema/ai.ts                          # ai_conversations, ai_messages, ai_usage
drizzle/0002_ai_pgvector.sql                 # pgvector extension + ai tables
src/lib/ai/provider.ts                       # Vercel AI SDK + Anthropic Opus 4.6
src/lib/ai/cost-tracker.ts                   # log every call, per-user usage rollup
src/lib/ai/embeddings.ts                     # OpenAI text-embedding-3-small
src/lib/ai/tools.ts                          # tool definitions (read + write)
src/app/api/ai/chat/route.ts                 # RAG-powered chat endpoint
src/lib/supabase/get-current-user.ts         # extend with accessibleEntityIds[]
```

### Files David is creating
```
src/components/ai/ai-button.tsx              # bottom-right AI button (Notion AI style)
src/components/ai/ai-panel.tsx               # slide-up panel, page-aware
src/components/ai/tool-card.tsx              # render tool calls as Confirm/Edit/Cancel
src/app/(dashboard)/chat/page.tsx            # full-page AI workspace
```

### API contract (David ↔ Jerry's AI)

David's AI button calls Jerry's AI's `/api/ai/chat` endpoint with this contract:

**Request:**
```ts
POST /api/ai/chat
{
  message: string,
  conversationId?: string,           // null = new conversation
  pageContext: {
    route: string,                    // e.g., "/pipeline"
    visibleEntities: Array<{
      type: string,                   // "opportunity" | "task" | "risk" | etc.
      id: string,
    }>
  }
}
```

**Response:** Server-Sent Events stream with chunks:
```ts
{ type: "text", content: string }                                // streaming text
{ type: "tool_call", tool: string, args: object, callId: string } // pending tool call (UI shows Confirm/Edit/Cancel)
{ type: "tool_result", callId: string, result: object }           // after user confirms
{ type: "citation", source: { type: "brain"|"db", id: string, label: string } }
{ type: "done", conversationId: string, costCents: number }
```

Tool calls go through David's `tool-card.tsx` which renders the Confirm/Edit/Cancel UI. On Confirm, David's component POSTs to:
```ts
POST /api/ai/tool/execute
{ callId, toolName, args }
```

---

## Sprint 2 (Days 4-7): Cross-Border Workflows + Pipeline + PWA + Feedback

### Files Jerry's AI is creating

```
src/db/schema/handoffs.ts                    # handoffs table
src/db/schema/threads.ts                     # threads + thread_messages
src/db/schema/watches.ts                     # watches table
src/db/schema/notifications.ts               # notifications table
src/db/schema/sales.ts                       # opportunities table
src/db/schema/demand.ts                      # demand_signals table
src/db/schema/contracts.ts                   # carrier_contracts table
src/db/schema/feedback.ts                    # user_feedback table
src/hooks/use-realtime.ts                    # generic Supabase Realtime hook
src/app/(dashboard)/pipeline/page.tsx        # Sales/Demand/Fulfillment/Carriers tabs
src/app/(dashboard)/finance/page.tsx         # Finance scaffold
src/app/(dashboard)/handoffs/[id]/page.tsx   # handoff detail page
src/app/(dashboard)/admin/feedback/page.tsx  # feedback triage
```

### Files David is creating

```
src/components/handoffs/handoff-button.tsx   # universal "Hand off" trigger
src/components/handoffs/handoff-card.tsx     # render handoff in inbox + detail pages
src/components/ui/notifications-drawer.tsx   # slide-in inbox drawer
src/components/ui/presence.tsx               # avatar stack on entity cards
src/components/ui/feedback-button.tsx        # bottom-left feedback widget
src/components/pwa/install-prompt.tsx        # iPhone "Add to Home Screen" prompt
src/components/home/needs-attention.tsx      # Home page widget
src/components/home/cross-functional-feed.tsx
public/manifest.json                          # PWA manifest
public/sw.js                                  # service worker
```

### People page rework (David)
- Group by department (Sales, Customer Service, Procurement, Operations, Finance, Compliance, IT, Leadership) — NOT by office
- Use existing `users.department_id`
- Need new role enum values (Jerry's AI will add to `src/db/schema/enums.ts`): `customer_service`, `procurement`, `operations`

### Side nav rework (David)
Replace existing nav with:
- 🏠 Home | 💰 Pipeline | 💵 Finance | ⚠️ Risks | ⚖️ Decisions | 📚 Knowledge | 👥 People | 🛠 Admin

Drop: Plan, My Tasks, Sales (folded into Pipeline), Organization (becomes People), Value Gains (folded into Finance or kept under a future Strategy tab)

Decisions stays. Risks stays.

---

## Sprint 3 (Days 8-10): Soft Launch + Iterate

### Day 8 — Soft launch
- Send Compass URL to 10 selected users:
  - Jerry, Alec, Jason
  - 2 US sales (Mike Pescha when he starts + 1 existing)
  - 3 China ops (Kelvin + 2 from Shanghai/Shenzhen team)
  - 2 leadership (Serena + 1 other)
- Brief onboarding doc explains: PWA install, AI button, handoffs, feedback button
- Monitor `user_feedback` table + `ai_usage` table daily

### Days 9-10 — Hot fixes based on feedback
- Triage top 5 items
- Tune AI prompts based on what users actually ask
- Adjust tool calling based on what tools are most/least used

---

## Cost Reality

**Vercel AI SDK:** free
**Anthropic API (Opus 4.6):** $15 input / $75 output per 1M tokens
**OpenAI embeddings (text-embedding-3-small):** $0.10 / 1M tokens

**Per-query cost (5K input + 500 output):**
- No caching: ~$0.11/query
- With prompt caching: ~$0.04/query

**At 10 users / $200/mo budget = $20/user/mo:**
- ~500 queries/user/mo with prompt caching = ~17 queries/day per user (comfortable)

**Strategy:**
1. Aggressive prompt caching (system prompt + entity context cached)
2. Use SQL/UI for navigation; AI only fires for high-stakes work (extraction, drafting, decisions)
3. Per-user cost dashboard — Jerry/David can spot heavy users
4. No hard cap during sprint; review weekly

---

## UUL Brain — Knowledge Layer

**Path:** `~/Work/[02] UUL Global/Brain/`

This is **UUL's organizational knowledge layer**, separate from Jerry's personal Brain. David has write access. The Compass indexer watches this path + the rest of `~/Work/[02] UUL Global/` and pushes embeddings to pgvector.

**Initial state:** Templates copied, Dashboard + Activity Log + README created. First migrated note: `[Meetings] UUL - 2026-04-13 Mgmt Call Jason Alec DPW Recruitment.md`.

**David doesn't need to interact with the vault directly during sprint** — he'll see content surface via Compass AI's RAG once the indexer is running.

---

## Architectural Principles (locked, do not deviate without discussion)

| Principle | Why |
|-----------|-----|
| **AI lives in Compass** | Crown jewel for IP/M&A; no external bot dependency |
| **Always human-confirm AI writes** | User control; reads stay frictionless |
| **PWA-first mobile** | 80% of native iOS for 5% of work |
| **App-layer entity scoping in queries** | RLS-ready; flip RLS on later without app changes |
| **AI tools inherit user permissions** | Even before formal RBAC, AI can't see what user can't see |
| **Soft delete columns on all new tables** | Hard to retrofit |
| **Cost tracking from day 1** | Retrofit is painful |
| **Supabase Realtime (not polling)** | Polling at 30+ users hits rate limits |

---

## Daily Sync

15-min daily call (Telegram or Zoom):
- What did each side ship yesterday
- What's blocked
- API contract changes
- Demos of new functionality

---

## Questions / Decisions Open

1. **AI button placement** — bottom-right is recommended. David, confirm or counter.
2. **AI conversation persistence** — should conversations persist across sessions or reset on logout?
3. **PWA app icon** — David, do you have design assets or should we generate via favicon.io?
4. **WeChat Work bot** — Sprint 3+ work, but want to scope: do we have the WeChat Work corp ID + secret already?

Tag Jerry in Compass repo issues for any architectural questions.
