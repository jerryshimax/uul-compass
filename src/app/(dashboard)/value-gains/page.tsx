import { getValueInitiatives, getValueSnapshots } from "@/lib/data";

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

const statusDot: Record<string, string> = {
  planned: "bg-slate-400",
  in_progress: "bg-amber-400",
  capturing: "bg-[#b4c5ff]",
  captured: "bg-emerald-400",
};

const statusLabel: Record<string, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  capturing: "Capturing",
  captured: "Captured",
};

// Growth priorities — what actually matters to UUL
const growthPriorities = [
  {
    id: "gp-aidc",
    name: "AIDC & Energy Infrastructure",
    description: "Data center buildout logistics — transformers, switchgear, GPU racks, cooling systems, BESS. Speed to power is the competitive moat.",
    status: "active" as const,
    icon: "bolt",
    metrics: [
      { label: "Pipeline", value: "3 prospects" },
      { label: "Avg Deal Size", value: "$2-5M" },
      { label: "Win Rate", value: "TBD" },
    ],
  },
  {
    id: "gp-new-customers",
    name: "New Key Customers",
    description: "Land high-margin, high-velocity accounts. Focus on PE-backed AIDC developers, advanced manufacturing, and energy transition companies.",
    status: "active" as const,
    icon: "group_add",
    metrics: [
      { label: "Targets Identified", value: "20" },
      { label: "Active Outreach", value: "4" },
      { label: "Closed", value: "0" },
    ],
  },
  {
    id: "gp-cross-sell",
    name: "Cross-Sell Existing Accounts",
    description: "Existing customers only use 1-2 services. Map all capabilities to customer needs and expand wallet share.",
    status: "planned" as const,
    icon: "swap_horiz",
    metrics: [
      { label: "Accounts Mapped", value: "0 / 20" },
      { label: "Revenue Uplift Target", value: "10-20%" },
      { label: "Campaign Launch", value: "Phase 2" },
    ],
  },
  {
    id: "gp-pricing",
    name: "Pricing Optimization",
    description: "Audit legacy pricing, implement surcharges, correct below-cost accounts. 1% pricing improvement = 6% profit improvement in logistics.",
    status: "active" as const,
    icon: "price_change",
    metrics: [
      { label: "Audit Progress", value: "In Progress" },
      { label: "Corrections Applied", value: "0" },
      { label: "Impact Target", value: "+3-5% revenue" },
    ],
  },
  {
    id: "gp-regional",
    name: "New Regional Markets",
    description: "Mexico, Indonesia & Malaysia, Nordic Europe — new offices to capture nearshoring, ASEAN growth, and European energy infrastructure demand.",
    status: "planned" as const,
    icon: "public",
    metrics: [
      { label: "Markets", value: "4 regions" },
      { label: "Offices Opened", value: "0 / 4" },
      { label: "Timeline", value: "Phase 2-3" },
    ],
  },
];

export default async function GrowthPage() {
  const [initiatives, snapshots] = await Promise.all([
    getValueInitiatives(),
    getValueSnapshots(),
  ]);

  const totalPlanned = initiatives.reduce((s, i) => s + i.plannedImpact, 0);
  const totalCaptured = initiatives.reduce((s, i) => s + i.capturedImpact, 0);
  const revenueInitiatives = initiatives.filter((i) => i.category === "revenue_growth");
  const revenueTotal = revenueInitiatives.reduce((s, i) => s + i.plannedImpact, 0);

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-light tracking-tight text-slate-100">
          Initiatives
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Strategic bets, value creation, and market development for the 100-day plan.
        </p>
      </div>

      {/* ── Top KPIs ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-[#131b2d] border-t-2 border-[#dfc299] p-4 flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Revenue Pipeline</span>
          <p className="text-2xl font-light tabular-nums text-[#dfc299]">{formatUsd(revenueTotal)}</p>
          <p className="text-[11px] text-slate-500">{revenueInitiatives.length} initiatives</p>
        </div>
        <div className="rounded-lg bg-[#131b2d] border-t-2 border-[#dfc299] p-4 flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Total Value Target</span>
          <p className="text-2xl font-light tabular-nums text-slate-300">{formatUsd(totalPlanned)}</p>
          <p className="text-[11px] text-slate-500">All categories</p>
        </div>
        <div className="rounded-lg bg-[#131b2d] border-t-2 border-[#dfc299] p-4 flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Value Captured</span>
          <p className="text-2xl font-light tabular-nums text-slate-500">{formatUsd(totalCaptured)}</p>
          <p className="text-[11px] text-slate-500">0% of target</p>
        </div>
        <div className="rounded-lg bg-[#131b2d] border-t-2 border-[#dfc299] p-4 flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Growth Priorities</span>
          <p className="text-2xl font-light tabular-nums text-[#b4c5ff]">{growthPriorities.filter((g) => g.status === "active").length}</p>
          <p className="text-[11px] text-slate-500">active of {growthPriorities.length}</p>
        </div>
      </div>

      {/* ── Growth Priorities ───────────────────────────── */}
      <div>
        <h2 className="font-serif text-2xl text-white mb-5">Growth Priorities</h2>
        <div className="space-y-4">
          {growthPriorities.map((gp) => (
            <div key={gp.id} className="rounded-lg bg-[#131b2d] p-5">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-[#1a2744] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#b4c5ff] text-xl">{gp.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-medium text-white">{gp.name}</h3>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold ${
                      gp.status === "active" ? "text-[#b4c5ff]" : "text-slate-500"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        gp.status === "active" ? "bg-[#b4c5ff]" : "bg-slate-600"
                      }`} />
                      {gp.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-400 leading-relaxed mb-4">{gp.description}</p>
                  <div className="flex flex-wrap gap-6">
                    {gp.metrics.map((m, i) => (
                      <div key={i}>
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">{m.label}</p>
                        <p className="text-sm font-medium text-slate-300 tabular-nums">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Value Initiatives (from data) ──────────────── */}
      <div>
        <h2 className="font-serif text-2xl text-white mb-5">Value Initiatives</h2>
        <div className="space-y-2">
          {initiatives.map((init) => (
            <div key={init.id} className="flex items-center gap-4 rounded-lg bg-[#131b2d] px-4 py-3 hover:bg-[#171f32] transition-colors">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#222a3d] text-[10px] font-medium text-slate-300 shrink-0">
                {init.owner.initials}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-200 truncate">{init.name}</span>
                <p className="text-[11px] text-slate-500">{init.owner.name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot[init.status]}`} />
                <span className="text-[10px] text-slate-500">{statusLabel[init.status]}</span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-[#dfc299] shrink-0">
                {formatUsd(init.plannedImpact)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Value Capture Trend ─────────────────────────── */}
      <div className="rounded-lg bg-[#131b2d] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-white">Value Capture Trend</h2>
          <div className="flex items-center gap-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded bg-[#b4c5ff]" />
              Planned
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded bg-[#dfc299]" />
              Captured
            </span>
          </div>
        </div>
        {(() => {
          const chartW = 600, chartH = 200, padX = 40, padY = 24;
          const plotW = chartW - padX * 2, plotH = chartH - padY * 2;
          const maxVal = Math.max(...snapshots.map((s) => Math.max(s.planned, s.captured)), 1);
          const pt = (i: number, val: number) => ({
            x: padX + (i / Math.max(snapshots.length - 1, 1)) * plotW,
            y: padY + plotH - (val / maxVal) * plotH,
          });
          const plannedLine = snapshots.map((s, i) => pt(i, s.planned)).map((p) => `${p.x},${p.y}`).join(" ");
          const capturedLine = snapshots.map((s, i) => pt(i, s.captured)).map((p) => `${p.x},${p.y}`).join(" ");

          return (
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const y = padY + plotH - frac * plotH;
                return (
                  <g key={frac}>
                    <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="#222a3d" strokeWidth="1" />
                    <text x={padX - 6} y={y + 3} textAnchor="end" fill="#6b7280" fontSize="9">{formatUsd(frac * maxVal)}</text>
                  </g>
                );
              })}
              {snapshots.map((s, i) => (
                <text key={i} x={pt(i, 0).x} y={chartH - 4} textAnchor="middle" fill="#6b7280" fontSize="9">
                  {s.month.split(" ")[0]}
                </text>
              ))}
              <polyline points={plannedLine} fill="none" stroke="#b4c5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {snapshots.map((s, i) => <circle key={`pl-${i}`} cx={pt(i, s.planned).x} cy={pt(i, s.planned).y} r="3" fill="#b4c5ff" />)}
              <polyline points={capturedLine} fill="none" stroke="#dfc299" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {snapshots.map((s, i) => <circle key={`cp-${i}`} cx={pt(i, s.captured).x} cy={pt(i, s.captured).y} r="3" fill="#dfc299" />)}
            </svg>
          );
        })()}
      </div>

      {/* ── Board Decisions ─────────────────────────────── */}
      <div>
        <h2 className="font-serif text-2xl text-white mb-5">Board Decisions</h2>
        <div className="space-y-4">
          {[
            {
              date: "Mar 31, 2026", meeting: "Strategy Call",
              attendees: "Jerry, Alic, Billy, Season",
              items: ["Exploring logistics stablecoin for on-chain factoring", "LC Warehouse + Packsmith WMS integration approved", "Ben Fogarty hired for corporate deck rewrite ($4K)"],
            },
            {
              date: "Mar 26, 2026", meeting: "Board Decision",
              attendees: "Jerry, Alic, Billy, Season",
              items: ["Shenzhen warehouse expansion approved", "Hiring 3 operations managers in Q2"],
            },
            {
              date: "Mar 25, 2026", meeting: "Operations & Cash Flow Review",
              attendees: "Jerry, Alic, Billy, Season, Jason, Josh",
              items: ["VP Finance hire approved at RMB 250-300K/year", "$20K marketing budget approved", "Bridge financing: Jerry to provide $300K if needed Apr-May", "Supply chain finance partnerships: Standard Chartered + Klear"],
            },
            {
              date: "Mar 23, 2026", meeting: "Board Sync",
              attendees: "Jerry, Alic, Billy",
              items: ["New sales rule: collect payment before shipping for all new contracts", "Silfab Plan A: demand 30% prepayment before port arrival", "Board structure: Jerry (Chair), Alic, Billy, Season", "Jason Likens appointed CEO US, Josh Foster appointed COO US", "Three business pillars confirmed: Logistics, SCF, Compliance & Sourcing"],
            },
          ].map((decision, di) => (
            <div key={di} className="rounded-lg bg-[#131b2d] p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-mono text-slate-600 tabular-nums">{decision.date}</span>
                <span className="text-sm text-white font-medium">{decision.meeting}</span>
                <span className="text-[11px] text-slate-500 ml-auto">{decision.attendees}</span>
              </div>
              <div className="space-y-2">
                {decision.items.map((item, ii) => (
                  <div key={ii} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-[12px] text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
