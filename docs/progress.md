# Compass — Build Progress

Last updated: 2026-04-14

---

## What Compass Is

Compass is an internal operations OS for UUL Global — a 100-day post-acquisition integration tracker. It covers task management, financial pulse, strategic pillar health, the sales pipeline, risks, decisions, and an AI assistant (Compass AI) powered by Claude.

**Tech stack:** Next.js 15 (App Router), Supabase (Postgres via Drizzle ORM), Tailwind, Claude API (Anthropic).

---

## Current UI — Page Inventory

| Route | Status | Purpose |
|---|---|---|
| `/` (Home/Overview) | ✅ Live | Command center — hero, integration timeline, my queue, needs attention, project task health, financial pulse, strategic pillars |
| `/chat` | ✅ Live | Full-page Compass AI workspace (Anthropic Claude) |
| `/pipeline` | ✅ Live | Sales pipeline — demand signals, fulfillment, carrier contracts tabs |
| `/decisions` | ✅ Live | Decision log — meetings, gates, outcomes |
| `/risks` | ✅ Live | Risk registry linked to tasks and workstreams |
| `/value-gains` | ✅ Live (nav hidden) | Value initiatives and growth priorities — in nav but pending Finance page to replace it |
| `/people` | ✅ Live | People — board, executive team, DB team directory grouped by dept, operating entities |
| `/tasks/[id]` | ✅ Live | Task detail — meetings, activities, comments, action items |
| `/plan` | ✅ Live | Full phase/kanban task manager — linked from homepage "View all tasks" |
| `/my-tasks` | ✅ Live | Personal task queue — linked from homepage "View all my tasks" |
| `/finance` | ❌ Not built | Finance page — needs spec/build |
| `/knowledge` | ❌ Not built | Knowledge base — needs spec/build |
| `/people` | ❌ Not built | People page (replaces Organization, grouped by department) |
| `/admin` | ❌ Not built | Admin — feedback triage, user management |

**Current nav (left sidebar):**
```
Home | Compass AI | Decisions | Value Gains | Pipeline | Risks | People
```
**Footer (nav sidebar):** Feedback (popover) | Support (popover) | Logout

**Jerry's target nav (Sprint 2):**
```
Home | Pipeline | Finance | Risks | Decisions | Knowledge | People | Admin
```

---

## AI / Compass AI — Current Capabilities

The Compass AI chatbot (Claude Sonnet 4.6) is accessible via the floating chat button (bottom-right, every page) and the full `/chat` page.

**What it can do today:**
- Answer questions about task status, owners, and due dates
- Perform bulk task updates from meeting transcripts (paste transcript → AI extracts updates → shows a confirmation card → applies on approve)
- Generate draft action items from meeting notes
- Propose task edits (ProposalCard UI) that user can accept/reject
- Maintain conversation context within a session

**API routes:**
- `POST /api/ai/chat` — main streaming chat endpoint
- `POST /api/ai/chat/draft/[messageId]` — process a draft message into a structured proposal

**Key components:**
- `src/components/ai/chat-provider.tsx` — global chat context/state
- `src/components/ai/chat-panel.tsx` — slide-in panel (persists across pages)
- `src/components/ai/chat-fab.tsx` — floating action button
- `src/app/(dashboard)/chat/page.tsx` — full-page workspace

---

## Data Layer

All data is fetched server-side via async getters in `src/lib/data/index.ts`, which query Supabase through Drizzle ORM. Pages are React Server Components that `await` these getters and pass results to `"use client"` content components.

**Live DB tables (Supabase):**
- `pmi_tasks`, `pmi_workstreams`, `pmi_milestones`, `pmi_phases`, `pmi_decision_gates`
- `risks`, `value_initiatives`, `value_snapshots`, `growth_priorities`
- `users`, `entities`, `offices`, `departments`, `contacts`
- `carrier_contracts`
- `meeting_notes`, `task_meetings`, `activities`, `comments`, `action_items`
- `user_feedback`

**Demo/hardcoded data (not yet wired to DB):**
- Financial Pulse metrics (`src/lib/data/demo/metrics.ts`)
- Strategic Pillar scorecard (`src/lib/data/demo/metrics.ts`)
- Sales pipeline data (`src/lib/data/demo/sales.ts`)

---

## Session Log

### 2026-04-14 — Major UI build (Session 1)

**Completed:**
- Pipeline page styling (token alignment, EmptyState component, warning icons)
- Pipeline added to side nav with translations
- Feedback button — fixed bottom-left, POST `/api/feedback`, 4 types (Bug/Idea/Question/Praise), auto-close on success
- `/chat` full-page AI workspace — MessageBubble, ProposalCard, DraftCard, ConfirmCard, auto-scroll, New Conversation button

### 2026-04-14 — Homepage redesign (Session 2)

**Goal:** Make the homepage a full command center so `/plan` and `/my-tasks` can be dropped from the nav (routes kept alive, linked from homepage).

**Completed:**
- **My Queue section** — current user's overdue + this-week tasks. "View all my tasks →" button links to `/my-tasks`. Clickable "N more later" row. Smart empty state.
- **Project Tasks section** — phase pill selector + workstream health rows (color dot, name, progress bar, done/total, blocked badge) + "View all tasks →" button linking to `/plan`. No task list on homepage (unusable on mobile).
- **Removed Plan and My Tasks from nav.** Routes stay alive with updated comments (no longer "deprecated" — actively linked from homepage).
- **Deleted 4 unused legacy components:** `task-group.tsx`, `plan-client.tsx`, `phase-timeline.tsx`, `milestone-strip.tsx`

### 2026-04-14 — Homepage polish (Session 3)

**Needs Attention rework:**
- Replaced flat card list with grouped compact-row panel in a single rounded container
- Items split into three color-coded groups: Blocked/Critical (red), Overdue (amber), Decision Gates (gold)
- Header shows RAG summary badges ("2 urgent · 3 overdue · 1 gate")
- Each row: task code | title | subtitle | workstream dot | badge | chevron
- `AttentionRow` extracted as a typed component

**Other homepage improvements:**
- Integration Timeline moved to top (Section 2, right after Hero)
- "View all my tasks" and "View all tasks" buttons — styled as visible pill buttons (not tiny text links)
- Both link labels made unambiguous: My Queue → "View all my tasks", Project Tasks → "View all tasks"

**Files changed:**
- `src/app/(dashboard)/dashboard-content.tsx`
- `src/lib/i18n/translations.ts` — added all new dashboard keys (en + zh)

### 2026-04-14 — People page + nav feedback (Session 4)

**People page (`/people`):**
- Replaces Organization (`/settings`) in the nav
- 4 sections: Board & Ownership (hardcoded), Executive Team (hardcoded), Team Directory (live from DB — users joined with departments + offices, grouped by department), Operating Entities (hardcoded)
- `getPeople()` getter added to `src/lib/data/index.ts` — joins `users → departments → offices`

**Feedback moved to nav:**
- Removed floating `FeedbackButton` component (`src/components/shared/feedback-button.tsx` deleted, removed from layout)
- Added Feedback as a footer button in the sidebar (same popover pattern as Support)
- Popover includes: type selector (Bug/Idea/Question/Praise), textarea, Send button — posts to existing `/api/feedback`

**Nav:**
- Organization → People (`/people`)
- Feedback + Support both in sidebar footer
- `/settings` route still alive but removed from nav

---

## To-Do / Backlog

Items are roughly prioritized — top is most urgent or most unblocked.

### Near-term (unblocked)

- [ ] **Nav overhaul — remaining items** (Jerry's Sprint 2 target)
  - Drop `Value Gains` from nav once Finance page exists
  - Drop `Compass AI` from main nav or move (not in Jerry's target nav — keep floating button)
  - Add `Finance`, `Knowledge`, `Admin` once pages exist
  - **Rule: full nav swap lands as one atomic change** — not piecemeal

- [ ] **Homepage — Financial Pulse: wire "Value Captured" to real DB data**
  - `valueInitiatives.capturedImpactCents` and `plannedImpactCents` are live in DB
  - Change `getFinancialPulse()` to compute from a real query instead of the hardcoded `$0 / $1.9M target`
  - The other 3 metrics (Cash, AR, Capital Fronted) require external financial data — see backlog

### Medium-term (needs design/spec)

- [ ] **Finance page** (`/finance`)
  - Absorbs `Value Gains` (`/value-gains`) content
  - Needs Jerry spec on layout — likely: synergy summary, value initiatives table, financial KPIs
  - Financial Pulse metrics (Cash, AR, Capital Fronted) require either accounting integration or a manual-entry `dashboard_kpis` Supabase table (key/value/label/trend/status rows)
  - Option (b) is the practical short-term path

- [ ] **Knowledge page** (`/knowledge`)
  - Intended to surface UUL Brain vault content via RAG/AI
  - Depends on UUL Brain indexer being deployed (pgvector, OpenAI embeddings)
  - Needs Jerry spec — may be a simple search/browse interface over embedded docs

- [ ] **Admin page** (`/admin`)
  - Jerry's plan: feedback triage at `/admin/feedback` (reads `user_feedback` table)
  - May also include user management, AI usage dashboard (per-user cost tracking)
  - Needs Jerry spec on full scope

- [ ] **Homepage — Strategic Pillars: partial DB wiring**
  - Two pillars derivable from DB: Vendor & Operations (from `carrier_contracts`), Regional Expansion (from `offices`)
  - Remaining 4 pillars need a `pillar_overrides` table (editorial) or stay hardcoded

- [ ] **Sales pipeline: real data**
  - Currently all demo (`src/lib/data/demo/sales.ts`)
  - `carrier_contracts`, `demand` schemas exist — need getter functions and wiring

### Long-term / Speculative

- [ ] Xero or QuickBooks integration for live Financial Pulse (Cash, AR)
- [ ] Pallet.AI pricing integration (Vendor & Operations pillar)
- [ ] CRM (Copper) integration for Sales Intelligence pillar
- [ ] PWA install prompt (iPhone "Add to Home Screen")
- [ ] Supabase Realtime for live task/handoff updates
- [ ] Mobile-optimized layout (currently desktop-first)

---

## Key Design Tokens (for consistency)

```
Background cards:   bg-[#131b2d]
Card hover:         bg-[#171f32]
Active/selected:    bg-[#1a2744]
Blue accent text:   text-[#b4c5ff]
Gold accent text:   text-[#dfc299]
Border standard:    border-slate-700/40
Border subtle:      border-slate-800/50
Progress bar fill:  bg-[#b4c5ff]
Progress bar track: bg-[#171f32]
```

---

## Infrastructure

- **Compass** (this repo): David owns — hosted on Vercel + Supabase (separate project from Orbit)
- **Orbit** (Jerry's): separate repo under `jerryshimax/` GitHub org
- Both use independent Vercel deployments and Supabase projects
- DB env vars: `DATABASE_URL` (pooled) + `DIRECT_URL` (direct for migrations) in `.env.local`
