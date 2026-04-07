# Sales Intelligence Module — Spec from Jason Likens

> Date: 2026-04-06
> Author: Jason Likens (CEO, US Operations)
> Reference JSX: `docs/sales-intelligence-v1.jsx`

## Core Design Principle

**Cross-Platform Correlation, Not Vendor Duplication.**

This page must earn its existence by showing things Copper, Wrike, and Slack cannot show individually. It provides the intersection regions of the vendor Venn Diagrams.

Competitors reference: C.H. Robinson (Navisphere Insight), Flexport Intelligence

## Data Sources

| Source | Type | Refresh |
|--------|------|---------|
| Copper CRM | Deal pipeline, contacts, activity | 15 min |
| Wrike PM | Task status, deliverables, overdue items | 15 min |
| Slack | Response times, mentions, silence detection | Real-time |
| Gmail | Email opens, proposal tracking | Hourly |

## Seven Key Element Groups

### 1. Command-Level KPIs (top row)
- **Weighted Pipeline** — Total pipeline value weighted by stage probability
- **Avg Days to Close** — Average deal cycle length
- **Activity-to-Close Ratio** — How many touchpoints per closed deal
- **Revenue at Risk** — Composite: Copper deal value + Wrike overdue tasks + Slack silence. No single vendor calculates this.

### 2. Cross-Platform Action Signals (highest value)
Alerts that emerge only when correlating data across systems:
- "ProtecPV quote expires in 48 hours but no follow-up logged in Copper" (Copper + Wrike)
- "Iron Mountain opened proposal email 4x but no call scheduled" (Copper + Gmail)
- "AmeriPouch booking confirmed — auto-moved to Active in pipeline" (Copper + Slack)

### 3. Pipeline by Vertical
Six key verticals (matches UUL's organizational structure):
- Renewable Energy ($8.4M, 68% win rate)
- Data Centers & AI ($6.2M, 52%)
- Traditional Energy ($4.0M, 71%)
- Automotive Mfg ($2.8M, 64%)
- Project Logistics ($2.1M, 59%)
- MedTech & Pharma ($1.6M, 73%)

Annual target: $55M. Pipeline coverage ratio tracked.

### 4. Pipeline Stage Distribution with Velocity
Stages: Prospecting → Discovery → Proposal → Negotiation → Closing
- Shows average days per stage (Flexport tracks this obsessively)
- Identifies where deals get stuck
- Operating orientation: "Tempo Tempo Tempo"

### 5. Rep Performance Matrix
Per rep: Pipeline ownership, 30-day activity count (Copper + Slack), stale deal flags, quota attainment.
- **"Stale" column** = Compass-only metric: flags reps whose deals have gone cold across ALL THREE platforms simultaneously
- Current reps: Russ Langley (Sr. Sales), Ella Fang (NAM), Quinn Redman (NAM), Rep 4 (Open/Hiring)

### 6. Activity Cadence Heatmap
7-day density map: calls, emails, Slack messages, meetings.
- Pattern recognition: is the team prospecting or just managing existing accounts?

### 7. AI-Weighted Revenue Forecast
Committed / Best Case / Stretch scenarios against $55-75M targets.
- Weighted by actual activity signals, not just rep self-reporting
- "HI+AI positioning becomes real — AI adjusts confidence based on behavioral data"

## Implementation Notes

- This is a Phase 2+ module — requires Copper/Wrike/Slack API integrations
- For now: can build the UI with demo data matching Jason's JSX
- The JSX uses inline styles (not Tailwind) — needs adaptation to Compass design system
- Key decision: does this replace the current "Growth" page or become a new `/sales` route?

## Demo Data (from JSX)

Verticals, reps, pipeline stages, and alert data are all defined in the JSX file. Use as seed data.
