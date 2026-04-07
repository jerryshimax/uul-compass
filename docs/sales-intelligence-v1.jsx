import { useState } from "react";

const COLORS = {
  bg: "#0a0e17",
  surface: "#111827",
  surfaceHover: "#1a2236",
  border: "#1e293b",
  borderActive: "#334155",
  accent: "#22d3ee",
  accentDim: "rgba(34,211,238,0.12)",
  accentGlow: "rgba(34,211,238,0.25)",
  warning: "#f59e0b",
  warningDim: "rgba(245,158,11,0.12)",
  danger: "#ef4444",
  dangerDim: "rgba(239,68,68,0.12)",
  success: "#10b981",
  successDim: "rgba(16,185,129,0.12)",
  purple: "#a78bfa",
  purpleDim: "rgba(167,139,250,0.12)",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  textDim: "#64748b",
};

const VERTICALS = [
  { name: "Renewable Energy", color: "#22d3ee", pipelineValue: 8420000, deals: 14, winRate: 68 },
  { name: "Data Centers & AI", color: "#a78bfa", pipelineValue: 6180000, deals: 9, winRate: 52 },
  { name: "Traditional Energy", color: "#f59e0b", pipelineValue: 3950000, deals: 7, winRate: 71 },
  { name: "Automotive Mfg", color: "#10b981", pipelineValue: 2840000, deals: 6, winRate: 64 },
  { name: "Project Logistics", color: "#f97316", pipelineValue: 2100000, deals: 5, winRate: 59 },
  { name: "MedTech & Pharma", color: "#ec4899", pipelineValue: 1650000, deals: 4, winRate: 73 },
];

const REPS = [
  { name: "Russ Langley", role: "Sr. Sales", pipeline: 4200000, activities: 47, staleDays: 0, quota: 85 },
  { name: "Ella Fang", role: "NAM Sales", pipeline: 3100000, activities: 38, staleDays: 2, quota: 72 },
  { name: "Quinn Redman", role: "NAM Sales", pipeline: 2800000, activities: 31, staleDays: 5, quota: 61 },
  { name: "Rep 4 (Open)", role: "Hiring", pipeline: 0, activities: 0, staleDays: 0, quota: 0 },
];

const ALERTS = [
  { type: "danger", icon: "⚠", text: "ProtecPV quote expires in 48 hours — no follow-up logged in Copper", source: "Copper + Wrike" },
  { type: "warning", icon: "⏱", text: "Silfab Solar — 3 open Wrike tasks overdue, blocking Q2 volume commitment", source: "Wrike" },
  { type: "info", icon: "📡", text: "Iron Mountain / Brett Spector opened proposal email 4x in last 24hrs — no call scheduled", source: "Copper" },
  { type: "success", icon: "✅", text: "AmeriPouch ocean booking confirmed — auto-moved to Active in pipeline", source: "Copper + Slack" },
];

const PIPELINE_STAGES = [
  { name: "Prospecting", count: 12, value: 3200000, color: "#64748b" },
  { name: "Discovery", count: 8, value: 5400000, color: "#22d3ee" },
  { name: "Proposal", count: 6, value: 7800000, color: "#a78bfa" },
  { name: "Negotiation", count: 4, value: 4100000, color: "#f59e0b" },
  { name: "Closing", count: 3, value: 2650000, color: "#10b981" },
];

function formatCurrency(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function KPICard({ label, value, subtext, color, trend, icon }) {
  return (
    <div style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12,
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: color || COLORS.accent,
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            {label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, lineHeight: 1.1, fontFamily: "'Space Grotesk', sans-serif" }}>
            {value}
          </div>
          {subtext && (
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 6 }}>
              {trend && <span style={{ color: trend === "up" ? COLORS.success : COLORS.danger, marginRight: 4 }}>{trend === "up" ? "↑" : "↓"}</span>}
              {subtext}
            </div>
          )}
        </div>
        <div style={{ fontSize: 22, opacity: 0.5 }}>{icon}</div>
      </div>
    </div>
  );
}

function PipelineBar({ stages }) {
  const total = stages.reduce((s, st) => s + st.value, 0);
  return (
    <div>
      <div style={{ display: "flex", gap: 2, height: 32, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
        {stages.map((s, i) => (
          <div key={i} style={{
            flex: s.value / total,
            background: s.color,
            opacity: 0.85,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "#fff",
            minWidth: s.value / total > 0.1 ? "auto" : 0,
          }}>
            {s.value / total > 0.12 && s.count}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {stages.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: COLORS.textMuted }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
            {s.name} · {formatCurrency(s.value)}
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertCard({ alert }) {
  const borderColor = alert.type === "danger" ? COLORS.danger : alert.type === "warning" ? COLORS.warning : alert.type === "success" ? COLORS.success : COLORS.accent;
  const bgColor = alert.type === "danger" ? COLORS.dangerDim : alert.type === "warning" ? COLORS.warningDim : alert.type === "success" ? COLORS.successDim : COLORS.accentDim;
  return (
    <div style={{
      background: bgColor,
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: "0 8px 8px 0",
      padding: "12px 16px",
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{alert.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>{alert.text}</div>
        <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{alert.source}</div>
      </div>
    </div>
  );
}

function VerticalMiniChart({ vertical, maxVal }) {
  const pct = (vertical.pipelineValue / maxVal) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
      <div style={{ width: 110, fontSize: 12, color: COLORS.textMuted, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {vertical.name}
      </div>
      <div style={{ flex: 1, height: 18, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
        <div style={{
          width: `${pct}%`, height: "100%", background: vertical.color, borderRadius: 4,
          opacity: 0.7, transition: "width 0.6s ease",
        }} />
      </div>
      <div style={{ width: 60, fontSize: 12, color: COLORS.text, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>
        {formatCurrency(vertical.pipelineValue)}
      </div>
      <div style={{ width: 40, fontSize: 11, color: vertical.winRate >= 65 ? COLORS.success : COLORS.textMuted, textAlign: "right" }}>
        {vertical.winRate}%
      </div>
    </div>
  );
}

function RepRow({ rep }) {
  const quotaColor = rep.quota >= 80 ? COLORS.success : rep.quota >= 60 ? COLORS.warning : COLORS.danger;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.6fr 0.6fr 0.8fr",
      padding: "10px 0", borderBottom: `1px solid ${COLORS.border}`,
      alignItems: "center", fontSize: 13,
    }}>
      <div>
        <div style={{ color: COLORS.text, fontWeight: 500 }}>{rep.name}</div>
        <div style={{ fontSize: 11, color: COLORS.textDim }}>{rep.role}</div>
      </div>
      <div style={{ color: COLORS.text, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
        {rep.pipeline > 0 ? formatCurrency(rep.pipeline) : "—"}
      </div>
      <div style={{ color: COLORS.textMuted, textAlign: "center" }}>
        {rep.activities > 0 ? rep.activities : "—"}
      </div>
      <div style={{ textAlign: "center" }}>
        {rep.staleDays > 3 ? (
          <span style={{ color: COLORS.danger, fontSize: 12 }}>{rep.staleDays}d</span>
        ) : rep.staleDays > 0 ? (
          <span style={{ color: COLORS.warning, fontSize: 12 }}>{rep.staleDays}d</span>
        ) : (
          <span style={{ color: COLORS.success, fontSize: 12 }}>✓</span>
        )}
      </div>
      <div>
        {rep.quota > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(rep.quota, 100)}%`, height: "100%", background: quotaColor, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 11, color: quotaColor, fontFamily: "'JetBrains Mono', monospace", width: 30, textAlign: "right" }}>{rep.quota}%</span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: COLORS.textDim, fontStyle: "italic" }}>Unfilled</span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, badge }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, margin: 0, letterSpacing: "-0.01em" }}>{title}</h3>
        {subtitle && <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {badge && (
        <span style={{
          fontSize: 10, padding: "3px 8px", borderRadius: 4,
          background: COLORS.accentDim, color: COLORS.accent,
          fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em"
        }}>{badge}</span>
      )}
    </div>
  );
}

function DataSourceTag({ name }) {
  return (
    <span style={{
      fontSize: 9, padding: "2px 6px", borderRadius: 3,
      background: "rgba(255,255,255,0.05)", color: COLORS.textDim,
      fontFamily: "'JetBrains Mono', monospace",
    }}>{name}</span>
  );
}

export default function SalesIntelligencePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const maxVerticalVal = Math.max(...VERTICALS.map(v => v.pipelineValue));
  const totalPipeline = PIPELINE_STAGES.reduce((s, st) => s + st.value, 0);

  const tabs = [
    { id: "overview", label: "Command View" },
    { id: "pipeline", label: "Pipeline Intel" },
    { id: "activity", label: "Activity Pulse" },
    { id: "forecast", label: "Revenue Forecast" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: COLORS.text,
      padding: 0,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${COLORS.border}`,
        padding: "16px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "rgba(17,24,39,0.8)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#0a0e17",
            }}>U</div>
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>UUL Compass</span>
          </div>
          <span style={{ color: COLORS.textDim, fontSize: 13 }}>/</span>
          <span style={{ fontSize: 14, color: COLORS.accent, fontWeight: 500 }}>Sales Intelligence</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {["Copper", "Wrike", "Slack", "Gmail"].map(s => (
            <div key={s} style={{
              fontSize: 9, padding: "3px 8px", borderRadius: 4,
              background: COLORS.successDim, color: COLORS.success,
              fontFamily: "'JetBrains Mono', monospace",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.success }} />
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        borderBottom: `1px solid ${COLORS.border}`,
        padding: "0 28px",
        display: "flex", gap: 0,
        background: COLORS.surface,
      }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "12px 20px",
            fontSize: 13,
            fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? COLORS.accent : COLORS.textMuted,
            background: "none",
            border: "none",
            borderBottom: activeTab === tab.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "inherit",
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ padding: "24px 28px", maxWidth: 1280, margin: "0 auto" }}>

        {/* Philosophy Banner */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.accentDim}, ${COLORS.purpleDim})`,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "14px 20px",
          marginBottom: 24,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 18 }}>🧠</span>
          <div>
            <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>
              HI+AI Sales Intelligence — Cross-platform synthesis, not vendor duplication
            </div>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>
              This page surfaces insights that only exist when Copper + Wrike + Slack + Gmail data are correlated together.
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          <KPICard label="Weighted Pipeline" value={formatCurrency(totalPipeline)} subtext="14% vs. last month" trend="up" icon="💎" color={COLORS.accent} />
          <KPICard label="Avg. Days to Close" value="34d" subtext="3d faster than Q1" trend="up" icon="⏳" color={COLORS.purple} />
          <KPICard label="Activity-to-Close Ratio" value="6.2:1" subtext="From 8.1:1 in Q4" trend="up" icon="📊" color={COLORS.success} />
          <KPICard label="Revenue at Risk" value="$1.4M" subtext="3 deals stale >7 days" trend="down" icon="🔥" color={COLORS.danger} />
        </div>

        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>

          {/* Cross-Platform Alerts */}
          <div style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: 22,
          }}>
            <SectionHeader
              title="Cross-Platform Action Signals"
              subtitle="Insights requiring Copper × Wrike × Slack correlation"
              badge="LIVE"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ALERTS.map((a, i) => <AlertCard key={i} alert={a} />)}
            </div>
          </div>

          {/* Pipeline by Vertical */}
          <div style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: 22,
          }}>
            <SectionHeader
              title="Pipeline by Vertical"
              subtitle="Weighted value + historical win rate"
              badge="COPPER"
            />
            <div style={{ marginBottom: 16 }}>
              {VERTICALS.map((v, i) => <VerticalMiniChart key={i} vertical={v} maxVal={maxVerticalVal} />)}
            </div>
            <div style={{ display: "flex", gap: 16, borderTop: `1px solid ${COLORS.border}`, paddingTop: 12, marginTop: 4 }}>
              <div style={{ fontSize: 11, color: COLORS.textDim }}>
                <span style={{ color: COLORS.text, fontWeight: 600 }}>$55M</span> annual target
              </div>
              <div style={{ fontSize: 11, color: COLORS.textDim }}>
                <span style={{ color: COLORS.accent, fontWeight: 600 }}>46%</span> pipeline coverage ratio
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Flow Bar */}
        <div style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`,
          borderRadius: 12, padding: 22, marginBottom: 28,
        }}>
          <SectionHeader title="Pipeline Stage Distribution" subtitle="Deals by stage — hover for velocity metrics" badge="COPPER + WRIKE" />
          <PipelineBar stages={PIPELINE_STAGES} />
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 20,
            borderTop: `1px solid ${COLORS.border}`, paddingTop: 16,
          }}>
            {PIPELINE_STAGES.map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'Space Grotesk', sans-serif" }}>{s.count}</div>
                <div style={{ fontSize: 11, color: COLORS.textDim }}>{s.name}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                  avg {[5, 8, 12, 7, 4][i]}d
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rep Performance + Velocity */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 20, marginBottom: 28 }}>

          {/* Rep Grid */}
          <div style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: 22,
          }}>
            <SectionHeader
              title="Rep Performance Matrix"
              subtitle="Pipeline, activity cadence, deal freshness, quota attainment"
              badge="COPPER + SLACK"
            />
            <div style={{
              display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.6fr 0.6fr 0.8fr",
              padding: "8px 0", borderBottom: `1px solid ${COLORS.borderActive}`,
              fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              <div>Rep</div>
              <div>Pipeline</div>
              <div style={{ textAlign: "center" }}>Acts/30d</div>
              <div style={{ textAlign: "center" }}>Stale</div>
              <div>Quota</div>
            </div>
            {REPS.map((r, i) => <RepRow key={i} rep={r} />)}
          </div>

          {/* What Compass Does Differently */}
          <div style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: 22,
          }}>
            <SectionHeader title="Why This Page Exists" subtitle="Value beyond vendor dashboards" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: "🔗", title: "Cross-Platform Correlation", desc: "Copper deal stage + Wrike task status + Slack response time = deal health score no single tool provides" },
                { icon: "⚡", title: "Stale Deal Detection", desc: "Flags pipeline opportunities where CRM activity AND Slack mentions AND Wrike tasks have all gone cold" },
                { icon: "📐", title: "Vertical × Rep × Stage Matrix", desc: "Maps which reps win in which verticals at which stages — invisible in Copper alone" },
                { icon: "🎯", title: "Revenue-at-Risk Scoring", desc: "Combines deal value, days-stale, missing follow-ups, and overdue deliverables into a single risk number" },
                { icon: "🔮", title: "Forecast Confidence", desc: "Weights rep self-reporting against actual activity cadence from Slack + Copper to adjust forecast accuracy" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: COLORS.textDim, lineHeight: 1.5, marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Grid: Forecast + Activity Heatmap + Deal Velocity */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 28 }}>

          {/* Revenue Forecast */}
          <div style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: 22,
          }}>
            <SectionHeader title="Q2 Revenue Forecast" badge="AI-WEIGHTED" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Committed", value: "$3.8M", pct: 69, color: COLORS.success },
                { label: "Best Case", value: "$5.2M", pct: 95, color: COLORS.accent },
                { label: "Stretch", value: "$6.1M", pct: 111, color: COLORS.purple },
              ].map((f, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: COLORS.textMuted }}>{f.label}</span>
                    <span style={{ fontSize: 12, color: f.color, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{f.value}</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(f.pct, 100)}%`, height: "100%", background: f.color, borderRadius: 3, opacity: 0.8 }} />
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 2, textAlign: "right" }}>{f.pct}% of $5.5M target</div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Heatmap */}
          <div style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: 22,
          }}>
            <SectionHeader title="Activity Cadence" subtitle="7-day touchpoint density" badge="SLACK + COPPER" />
            <div style={{ display: "grid", gridTemplateColumns: "auto repeat(7, 1fr)", gap: 3, alignItems: "center" }}>
              <div style={{ fontSize: 10, color: COLORS.textDim, paddingRight: 8 }}></div>
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} style={{ fontSize: 9, color: COLORS.textDim, textAlign: "center" }}>{d}</div>
              ))}
              {["Calls", "Emails", "Slack", "Meetings"].map((type, ri) => (
                <>
                  <div key={`l-${ri}`} style={{ fontSize: 10, color: COLORS.textMuted, paddingRight: 8 }}>{type}</div>
                  {[4, 6, 8, 3, 7, 1, 0, 12, 15, 9, 14, 11, 2, 1, 3, 5, 7, 4, 6, 0, 0, 2, 3, 4, 1, 3, 0, 0].slice(ri * 7, ri * 7 + 7).map((v, ci) => (
                    <div key={`c-${ri}-${ci}`} style={{
                      width: "100%", aspectRatio: "1", borderRadius: 3,
                      background: v === 0 ? "rgba(255,255,255,0.03)" : `rgba(34,211,238,${Math.min(v / 15, 0.8)})`,
                    }} />
                  ))}
                </>
              ))}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: COLORS.textDim }}>Low</span>
              {[0.05, 0.15, 0.3, 0.5, 0.8].map((o, i) => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: 2, background: `rgba(34,211,238,${o})` }} />
              ))}
              <span style={{ fontSize: 10, color: COLORS.textDim }}>High</span>
            </div>
          </div>

          {/* Deal Velocity */}
          <div style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: 22,
          }}>
            <SectionHeader title="Deal Velocity Trends" subtitle="Average days per stage over 90d" badge="COPPER" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { stage: "Prospecting → Discovery", days: 5, prev: 7, color: COLORS.accent },
                { stage: "Discovery → Proposal", days: 8, prev: 10, color: COLORS.purple },
                { stage: "Proposal → Negotiation", days: 12, prev: 11, color: COLORS.warning },
                { stage: "Negotiation → Close", days: 7, prev: 9, color: COLORS.success },
              ].map((v, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>{v.stage}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: v.color, fontFamily: "'JetBrains Mono', monospace" }}>{v.days}d</span>
                      <span style={{ fontSize: 10, color: v.days <= v.prev ? COLORS.success : COLORS.danger }}>
                        {v.days <= v.prev ? "↓" : "↑"}{Math.abs(v.days - v.prev)}d
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
                    <div style={{ width: `${(v.days / 15) * 100}%`, height: "100%", background: v.color, borderRadius: 2, opacity: 0.7 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: "10px 12px", background: COLORS.successDim, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: COLORS.success, fontWeight: 500 }}>Total Cycle: 32 days (was 37)</div>
              <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 2 }}>13.5% improvement quarter-over-quarter</div>
            </div>
          </div>
        </div>

        {/* Footer: Data Architecture Note */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "16px 22px",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Data Sources</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <DataSourceTag name="Copper CRM" />
              <DataSourceTag name="Wrike PM" />
              <DataSourceTag name="Slack" />
              <DataSourceTag name="Gmail" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Refresh Cadence</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>Copper/Wrike: 15min · Slack: real-time · Gmail: hourly</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Unique Value</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>7 composite metrics not available in any single vendor tool</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Last Sync</div>
            <div style={{ fontSize: 12, color: COLORS.success }}>All sources healthy · 2 min ago</div>
          </div>
        </div>

      </div>
    </div>
  );
}
