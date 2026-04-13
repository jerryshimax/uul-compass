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

## Division of Labor

Jerry is acting as **Product Manager** for Compass, using Claude Code (with plan mode + vibe coding) to design and author product-shaped code. David is the **Engineer** responsible for infrastructure, wiring, deployment, and bug fixes.

### Jerry (PM, using Claude Code)
- Product design decisions (IA, UX, flows)
- Database schemas (Drizzle definitions)
- Business logic (server actions, AI tools, data layer)
- AI prompts and tool definitions
- API contracts (what routes exist, what they return)
- Documentation (this plan, ADRs, guides)
- UUL Brain vault maintenance (content)

**Jerry does NOT do:** git operations, deployment, npm install, drizzle-kit push, environment variables, manual config edits, bug fixes on David's code.

### David (Engineer)
- Install dependencies (`npm install ai@^6.0.0 @ai-sdk/gateway @ai-sdk/openai zod` etc.)
- Run migrations (`npx drizzle-kit generate && npx drizzle-kit push`)
- Environment setup (AI Gateway enablement, OIDC, OpenAI API key, env vars)
- Wire up React components (consume the server actions and API routes Jerry defines)
- Deployment (Vercel + domain + PWA assets)
- UUL Brain indexer deployment (local Node service)
- PWA manifest, service worker, push notifications
- Supabase config (pgvector, Realtime enablement)
- Bug fixes, perf optimization, accessibility
- Mobile responsive polish, tablet breakpoints
- Page-aware AI button UI + streaming UI + tool-call confirmation cards

**David does NOT do:** product/scope decisions (check with Jerry first), business logic changes that break the schema contract.

### Coordination
- Daily 15-min sync (Telegram or quick call)
- Feature branch: `feature/v1-ai-os` (don't merge to `main` until sprint review)
- Jerry drops schema/API changes, David wires up + migrates
- When David needs a clarification, TG Jerry directly

---

## Day 1 — David's Setup Checklist

These need to happen on day 1 so the rest of the work isn't blocked:

| # | Item | Why |
|---|------|-----|
| 1 | **Enable AI Gateway in Vercel project** | Vercel dashboard → Project → Settings → AI Gateway → Enable. Routes all LLM calls through Gateway with unified observability + per-user cost tracking. Free tier covers initial sprint usage. |
| 2 | **Confirm Vercel project on UUL team** | Or transfer to UUL's Vercel team. Add UUL billing card. AI Gateway billing rolls up to Vercel team account (zero markup on tokens). |
| 3 | **Confirm Supabase project on UUL billing** | Note: pgvector requires Pro tier ($25/mo) if not already on it. |
| 4 | **Run `vercel env pull .env.local`** | Provisions `VERCEL_OIDC_TOKEN` for local dev (~24h validity, re-pull when expired). NO need for manual `ANTHROPIC_API_KEY` — Gateway uses OIDC auth in production automatically. |
| 5 | **OpenAI API key for embeddings** | text-embedding-3-small at $0.10/1M tokens. Embeddings don't go through Gateway — use direct provider SDK. Store as `OPENAI_API_KEY` in Vercel env + `.env.local`. |
| 6 | **Set non-AI env vars** in Vercel | `OPENAI_API_KEY`, `COMPASS_BRAIN_PATH` (path to UUL Brain for the indexer), `NEXT_PUBLIC_REALTIME_URL` |
| 7 | **Enable pgvector extension** on Supabase | Run `CREATE EXTENSION IF NOT EXISTS vector;` in Supabase SQL editor (or apply `drizzle/0002_pgvector.sql`) |
| 8 | **Set AI Gateway budget alerts** | Vercel dashboard → AI Gateway → Usage & Budgets → set monthly budget ~$300 (covers 10-user sprint with buffer). Email alert at 80%. |
| 9 | **Domain pointing** | Point `compass.uulglobal.com` to Vercel project. Vercel auto-provisions SSL. |
| 10 | **Create feature branch** | Already done: `feature/v1-ai-os`. Pull from origin to get latest schemas. |

---

## David's Action Items — Day 1 (2026-04-13 work dropped by Jerry)

Jerry shipped these files on `feature/v1-ai-os` branch. David, please wire up:

### 1. Install new dependencies

```bash
cd ~/Ship/uul/compass
npm install ai@^6.0.0 @ai-sdk/gateway @ai-sdk/openai zod
```

### 2. Enable Vercel AI Gateway

- Vercel dashboard → compass project → Settings → AI Gateway → Enable
- Set monthly budget to **$300/mo** with email alert at 80%
- Run `vercel env pull .env.local` to get `VERCEL_OIDC_TOKEN`

### 3. Add environment variables (Vercel + .env.local)

```
OPENAI_API_KEY=sk-...                             # for embeddings only
COMPASS_BRAIN_PATH=/path/to/UUL Global/Brain     # indexer target (when deployed)
NEXT_PUBLIC_COMPASS_ENV=production|preview|dev
```

No `ANTHROPIC_API_KEY` needed — AI Gateway uses OIDC.

### 4. Supabase: enable pgvector

Supabase SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Confirm with `SELECT extversion FROM pg_extension WHERE extname = 'vector';`.

### 5. Generate and apply new migrations

New schema files that need migrations:
- `src/db/schema/ai.ts` (7 new tables: ai_conversations, ai_messages, ai_tool_calls, ai_usage, ai_embeddings, ai_insights, ai_briefs)
- `src/db/schema/handoffs.ts`
- `src/db/schema/threads.ts` (3 tables: threads, thread_participants, thread_messages)
- `src/db/schema/watches.ts`
- `src/db/schema/notifications.ts`
- `src/db/schema/sales.ts` (2 tables: opportunities, opportunity_activities)
- `src/db/schema/demand.ts`
- `src/db/schema/contracts.ts` (2 tables: carrier_contracts, contract_utilization)
- `src/db/schema/office-status.ts`
- `src/db/schema/feedback.ts`
- New enum values added to `src/db/schema/enums.ts` — role enum gets `customer_service`, `procurement`, `operations`; plus new enums for AI, handoffs, watches, notifications, opportunities, demand, contracts, feedback.

```bash
# Generate migration (creates 0003_xxx.sql)
npx drizzle-kit generate

# Review the generated SQL file before pushing
cat drizzle/0003_*.sql

# Apply to Supabase
npx drizzle-kit push
```

### 6. Add vector column + HNSW index

AFTER step 5 (ai_embeddings table exists), run in Supabase SQL editor:

```sql
ALTER TABLE ai_embeddings ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS ai_embeddings_vec_hnsw_idx
  ON ai_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

(Also saved at `drizzle/0004_pgvector_column.sql` for reference.)

### 7. Enable Supabase Realtime

Supabase dashboard → Database → Replication → enable replication on:

- handoffs
- notifications
- threads, thread_messages
- office_status
- ai_messages (so AI streaming works cross-tab)
- opportunities
- demand_signals
- pmi_tasks (already in existing schema)
- risks (already in existing schema)
- comments

### 8. Seed user entity access

The `getCurrentUser` function now returns `accessibleEntityIds` from the `user_entity_access` table. That table must be populated for existing users or they'll see no data. Quick seed script idea:

```sql
-- Give every existing user full access to UUL entity (the main entity)
INSERT INTO user_entity_access (user_id, entity_id, access_level)
SELECT u.id, e.id, 'full'
FROM users u
CROSS JOIN entities e
WHERE e.code = 'UUL'
  AND NOT EXISTS (
    SELECT 1 FROM user_entity_access
    WHERE user_id = u.id AND entity_id = e.id
  );
```

Adjust per-user access manually for cross-entity employees.

### 9. (Not yet — Sprint 1 Day 2-3)

Jerry will drop:
- `src/app/api/ai/chat/route.ts` — RAG streaming endpoint
- `src/app/api/ai/tool/execute/route.ts` — executes confirmed tool calls
- AI tool executor functions (read + write tools wired to Drizzle)
- Local UUL Brain indexer Node service

David will then wire up:
- `src/components/ai/ai-button.tsx` — bottom-right button
- `src/components/ai/ai-panel.tsx` — slide-up panel, page-aware
- `src/components/ai/tool-card.tsx` — Confirm/Edit/Cancel cards
- `src/app/(dashboard)/chat/page.tsx` — full-page AI workspace

**API contract for AI chat** is in this doc under "API contract (David ↔ Jerry's AI)" below.

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

**Vercel AI SDK + AI Gateway:** free (zero markup on tokens; first $X/mo of free credits per Vercel team)
**Claude Opus 4.6 (via Gateway):** $15 input / $75 output per 1M tokens
**OpenAI embeddings (direct SDK, not Gateway):** $0.10 / 1M tokens (text-embedding-3-small)

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
