# Compass OS — Architecture & Feature Spec (Reference)

> Source: Professional PMI dashboard best practices review (2026-04-07)
> Status: Reference document — items triaged into Now / Phase 2 / Later

## Triage Summary

### Adopt Now (current sprint)
- Progressive disclosure with RAG traffic lights on executive landing page
- Key employee retention as a tracked KPI
- Module-based page architecture (already in place)

### Phase 2 (post-Supabase, Days 30-60)
- Bullet graphs for synergy target tracking
- Waterfall chart for integration cost vs. captured value (EBITDA bridge)
- Risk matrix visualization (likelihood x impact)
- Integration ROI tracking per initiative
- RBAC — functional owner cannot self-validate financial metrics
- Decoupled schema: execution tables vs. financial validation tables
- Auto-save + offline caching for mobile resilience
- Async background recalculation for heavy queries

### Phase 3+ (post-100-day, when data volume justifies it)
- LLM root-cause analysis for metric variances
- Predictive milestone forecasting from historical velocity
- NLP sentiment analysis on team pulse surveys
- ERP/HRIS API connectors
- Dynamic configuration wizard for IMO

### Not applicable to UUL's current situation
- ESG/GHG tracking (private company, no reporting obligation)
- Clean team antitrust protocol (acquisition already closed)
- Statutory deadline automation (manual tracking sufficient at current scale)

---

## Full Spec (verbatim)

### 1. Core Architectural & System Requirements

**Module-Based Architecture:** The application must not be a monolithic view. The system should be built with specialized dashboard modules operating on a unified, real-time data ontology. The core modules include: Executive Integration Overview, Synergy Realization, People & Culture, Operational Readiness, and Risk & Compliance.

**Dynamic Configuration:** The architecture must allow the Integration Management Office (IMO) to define the target operating model via a strategic setup wizard. This wizard will configure the visible metrics, alert thresholds, and reporting cadences based on the specific type of transaction (e.g., holding arrangement vs. full integration).

**Decoupled Schema (Execution vs. Validation):** The database schema must strictly separate "Synergy Realization" (operational execution) from "Synergy Tracking" (financial validation).

**Role-Based Access Control (RBAC):** Advanced RBAC is required so that a functional owner who drives an initiative cannot independently validate the resulting financial metrics. Validation must require an independent IMO analyst or financial controller.

### 2. Frontend & UI/UX Design Heuristics

**Progressive Disclosure Framework:** The UI must aggressively manage cognitive load by preventing the display of all data tables simultaneously. The executive landing page must rely on macro-level indicators using a Red/Amber/Green traffic light system. Users should only see granular data when clicking into an "Amber" or "Red" status.

**Data Visualization Rules:**
- Use Bullet Graphs instead of circular gauges or standard bar charts for tracking synergy targets, allowing multiple metrics to be compared in a minimal spatial footprint.
- Use Waterfall Charts exclusively to visualize how one-time integration costs impact and erode realized synergies and net value creation.
- Use Matrix Visualizations (Likelihood vs. Impact) for the Risk & Compliance module.

**Resilient UX:** The frontend must feature robust automatic saving mechanisms and alert users to local connectivity issues, caching data locally to prevent loss during server timeouts. Heavy database recalculations must happen asynchronously in the background to prevent the UI from freezing.

### 3. Key Metric Tracking & Logic Requirements

**Integration ROI Logic:** The system must explicitly track the expenses and one-time capital outlays required to execute the integration, calculating the Return on Investment (ROI) of the integration itself project-by-project. It must automatically flag negative ROI projects for executive review.

**Financial & Operational KPIs:** The dashboard needs to track Revenue Synergies, Cost Savings, Working Capital Efficiency, and Day 1 Readiness Scores (checklist-driven metrics).

**People & Culture KPIs:** Required metrics include Key Employee Retention Rate, Redundancy/Severance tracking, and the actual hours teams invest in integration tasks to monitor burnout.

**ESG & Sustainability Integration:** The platform must place Environmental, Social, and Governance (ESG) performance at the center of tracking. Metrics must include Responsible Sourcing Policies, Living Wage targets, and Greenhouse Gas (GHG) reduction protocols.

### 4. Backend APIs & Advanced AI Integrations

**Autonomous Root-Cause Investigation:** The backend needs to integrate Large Language Models (LLMs) to unify structured numerical data with unstructured data (meeting transcripts, document evidence). If a metric falls behind, the AI must automatically provide plain-text explanations for the variance.

**Predictive Forecasting:** The dashboard must analyze historical velocity to probabilistically predict when milestones will slip, alerting the IMO weeks before a metric turns "Red".

**Natural Language Processing (NLP):** NLP should be utilized for sentiment analysis on pulse surveys to generate a "Cultural Alignment Score," as well as for analyzing legacy legal contracts to identify problematic clauses rapidly.

**ERP/HRIS Extensibility:** The dashboard must feature robust APIs to pull data directly from ERP systems, HRIS platforms, and financial software rather than relying on manual data input.

### 5. Security & Compliance Rules

**Statutory Deadline Automation:** The backend must track and automate notifications for legal entity management deadlines, such as state withdrawals, DBA name changes, and registered agent updates, to avoid statutory fines.

**Clean Team Protocol (Antitrust):** A specialized, firewalled access protocol must be built to silo sensitive competitive data (future pricing, unannounced closures) prior to full legal clearance. The system must maintain an immutable audit trail of every access attempt to this siloed data.
