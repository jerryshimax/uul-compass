"use client";

import { useState } from "react";
import type {
  SalesVertical, SalesRep, SalesAlert, PipelineStage,
  VelocityTrend, ForecastScenario,
} from "@/lib/data/demo/sales";

interface SalesData {
  verticals: SalesVertical[];
  reps: SalesRep[];
  alerts: SalesAlert[];
  pipelineStages: PipelineStage[];
  velocityTrends: VelocityTrend[];
  forecast: ForecastScenario[];
  activityHeatmap: { channels: string[]; days: string[]; data: number[][] };
  kpis: {
    weightedPipeline: number;
    avgDaysToClose: number;
    activityToCloseRatio: string;
    revenueAtRisk: number;
    annualTarget: number;
    totalCycleDays: number;
    prevCycleDays: number;
  };
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

const ALERT_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  danger: { border: "border-red-400", bg: "bg-red-400/5", icon: "warning" },
  warning: { border: "border-amber-400", bg: "bg-amber-400/5", icon: "schedule" },
  info: { border: "border-[#b4c5ff]", bg: "bg-[#b4c5ff]/5", icon: "satellite_alt" },
  success: { border: "border-emerald-400", bg: "bg-emerald-400/5", icon: "check_circle" },
};

export function SalesContent({ data }: { data: SalesData }) {
  const [activeTab, setActiveTab] = useState<"pipeline" | "reps" | "forecast">("pipeline");

  const tabs = [
    { id: "pipeline" as const, label: "Pipeline" },
    { id: "reps" as const, label: "Reps" },
    { id: "forecast" as const, label: "Forecast" },
  ];

  const totalPipeline = data.pipelineStages.reduce((s, st) => s + st.value, 0);
  const pipelineCoverage = Math.round((totalPipeline / data.kpis.annualTarget) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-light tracking-tight text-white">
          Sales Intelligence
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Cross-platform insights from Copper, Wrike, Slack, and Gmail.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#131b2d] rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#1a2744] text-[#b4c5ff]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════ PIPELINE TAB ════════════════ */}
      {activeTab === "pipeline" && (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Weighted Pipeline" value={formatUsd(data.kpis.weightedPipeline)} sub="14% vs. last month" trend="up" color="border-[#b4c5ff]" />
            <KPICard label="Avg. Days to Close" value={`${data.kpis.avgDaysToClose}d`} sub="3d faster than Q1" trend="up" color="border-[#8b5cf6]" />
            <KPICard label="Activity-to-Close" value={data.kpis.activityToCloseRatio} sub="From 8.1:1 in Q4" trend="up" color="border-emerald-400" />
            <KPICard label="Revenue at Risk" value={formatUsd(data.kpis.revenueAtRisk)} sub="3 deals stale >7 days" trend="down" color="border-red-400" />
          </div>

          {/* Cross-Platform Action Signals */}
          <div className="rounded-lg bg-[#131b2d] p-5">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-medium text-white">Cross-Platform Action Signals</h2>
              <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400">Live</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">Insights requiring Copper x Wrike x Slack correlation</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.alerts.map((alert, i) => {
                const style = ALERT_STYLES[alert.type] || ALERT_STYLES.info;
                return (
                  <div key={i} className={`rounded-lg ${style.bg} border-l-2 ${style.border} p-4`}>
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-base text-slate-400 mt-0.5">{style.icon}</span>
                      <div>
                        <p className="text-[12px] text-slate-200 leading-relaxed">{alert.text}</p>
                        <p className="text-[10px] text-slate-600 mt-2 font-mono">{alert.source}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pipeline by Vertical + Stage Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Verticals */}
            <div className="rounded-lg bg-[#131b2d] p-5">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-base font-medium text-white">Pipeline by Vertical</h2>
                <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[#b4c5ff]/10 text-[#b4c5ff] font-mono">Copper</span>
              </div>
              <div className="space-y-3">
                {data.verticals.map((v) => {
                  const maxVal = Math.max(...data.verticals.map((x) => x.pipelineValue));
                  const pct = (v.pipelineValue / maxVal) * 100;
                  return (
                    <div key={v.name} className="flex items-center gap-3">
                      <span className="text-[12px] text-slate-400 w-28 shrink-0 truncate">{v.name}</span>
                      <div className="flex-1 h-4 bg-[#171f32] rounded overflow-hidden">
                        <div className="h-full rounded opacity-70" style={{ width: `${pct}%`, backgroundColor: v.color }} />
                      </div>
                      <span className="text-[12px] text-slate-300 font-mono tabular-nums w-14 text-right">{formatUsd(v.pipelineValue)}</span>
                      <span className={`text-[11px] tabular-nums w-10 text-right ${v.winRate >= 65 ? "text-emerald-400" : "text-slate-500"}`}>
                        {v.winRate}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 border-t border-slate-800/50 pt-3 mt-4 text-[11px] text-slate-500">
                <span><span className="text-white font-semibold">{formatUsd(data.kpis.annualTarget)}</span> annual target</span>
                <span><span className="text-[#b4c5ff] font-semibold">{pipelineCoverage}%</span> pipeline coverage</span>
              </div>
            </div>

            {/* Stage Distribution */}
            <div className="rounded-lg bg-[#131b2d] p-5">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-base font-medium text-white">Pipeline Stages</h2>
                <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[#b4c5ff]/10 text-[#b4c5ff] font-mono">Copper + Wrike</span>
              </div>

              {/* Stacked bar */}
              <div className="flex gap-0.5 h-8 rounded-md overflow-hidden mb-4">
                {data.pipelineStages.map((s) => (
                  <div key={s.name} className="flex items-center justify-center" style={{ flex: s.value / totalPipeline, backgroundColor: s.color, opacity: 0.75 }}>
                    {s.value / totalPipeline > 0.12 && (
                      <span className="text-[10px] font-bold text-white">{s.count}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Stage details */}
              <div className="grid grid-cols-5 gap-2">
                {data.pipelineStages.map((s) => (
                  <div key={s.name} className="text-center">
                    <p className="text-lg font-semibold tabular-nums" style={{ color: s.color }}>{s.count}</p>
                    <p className="text-[10px] text-slate-500">{s.name}</p>
                    <p className="text-[10px] text-slate-600 font-mono">avg {s.avgDays}d</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ REPS TAB ════════════════ */}
      {activeTab === "reps" && (
        <div className="space-y-6">
          {/* Rep Performance Matrix */}
          <div className="rounded-lg bg-[#131b2d] p-5">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-medium text-white">Rep Performance Matrix</h2>
              <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[#b4c5ff]/10 text-[#b4c5ff] font-mono">Copper + Slack</span>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[1.4fr_0.8fr_0.6fr_0.6fr_0.8fr] gap-2 py-2 border-b border-slate-700/50 text-[10px] uppercase tracking-wider text-slate-600 font-mono">
              <div>Rep</div>
              <div>Pipeline</div>
              <div className="text-center">Acts/30d</div>
              <div className="text-center">Stale</div>
              <div>Quota</div>
            </div>

            {/* Rows */}
            {data.reps.map((rep) => {
              const quotaColor = rep.quota >= 80 ? "bg-emerald-400" : rep.quota >= 60 ? "bg-amber-400" : "bg-red-400";
              const quotaText = rep.quota >= 80 ? "text-emerald-400" : rep.quota >= 60 ? "text-amber-400" : "text-red-400";
              return (
                <div key={rep.name} className="grid grid-cols-[1.4fr_0.8fr_0.6fr_0.6fr_0.8fr] gap-2 py-3 border-b border-slate-800/30 items-center">
                  <div>
                    <p className="text-sm text-white font-medium">{rep.name}</p>
                    <p className="text-[11px] text-slate-500">{rep.role}</p>
                  </div>
                  <div className="text-sm text-slate-300 font-mono tabular-nums">
                    {rep.pipeline > 0 ? formatUsd(rep.pipeline) : "—"}
                  </div>
                  <div className="text-center text-sm text-slate-400 tabular-nums">
                    {rep.activities > 0 ? rep.activities : "—"}
                  </div>
                  <div className="text-center text-sm">
                    {rep.staleDays > 3 ? (
                      <span className="text-red-400">{rep.staleDays}d</span>
                    ) : rep.staleDays > 0 ? (
                      <span className="text-amber-400">{rep.staleDays}d</span>
                    ) : rep.pipeline > 0 ? (
                      <span className="text-emerald-400">&#10003;</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </div>
                  <div>
                    {rep.quota > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#171f32] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${quotaColor}`} style={{ width: `${Math.min(rep.quota, 100)}%` }} />
                        </div>
                        <span className={`text-[11px] font-mono tabular-nums ${quotaText}`}>{rep.quota}%</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-600 italic">Unfilled</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Activity Heatmap */}
          <div className="rounded-lg bg-[#131b2d] p-5">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-medium text-white">Activity Cadence</h2>
              <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[#b4c5ff]/10 text-[#b4c5ff] font-mono">Slack + Copper</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">7-day touchpoint density</p>

            <div className="grid gap-1" style={{ gridTemplateColumns: "70px repeat(7, 1fr)" }}>
              {/* Day headers */}
              <div />
              {data.activityHeatmap.days.map((d, i) => (
                <div key={i} className="text-center text-[10px] text-slate-600">{d}</div>
              ))}

              {/* Rows */}
              {data.activityHeatmap.channels.map((channel, ri) => (
                <>
                  <div key={`l-${ri}`} className="text-[11px] text-slate-500 flex items-center">{channel}</div>
                  {data.activityHeatmap.data[ri].map((v, ci) => (
                    <div
                      key={`c-${ri}-${ci}`}
                      className="aspect-square rounded-sm"
                      style={{
                        backgroundColor: v === 0
                          ? "rgba(255,255,255,0.03)"
                          : `rgba(180,197,255,${Math.min(v / 15, 0.8)})`,
                      }}
                    />
                  ))}
                </>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] text-slate-600">Low</span>
              {[0.05, 0.15, 0.3, 0.5, 0.8].map((o, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: `rgba(180,197,255,${o})` }} />
              ))}
              <span className="text-[10px] text-slate-600">High</span>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ FORECAST TAB ════════════════ */}
      {activeTab === "forecast" && (
        <div className="space-y-6">
          {/* Revenue Forecast */}
          <div className="rounded-lg bg-[#131b2d] p-5">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-base font-medium text-white">Q2 Revenue Forecast</h2>
              <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[#dfc299]/10 text-[#dfc299] font-mono">AI-Weighted</span>
            </div>

            <div className="space-y-5">
              {data.forecast.map((f) => (
                <div key={f.label}>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm text-slate-400">{f.label}</span>
                    <span className="text-lg font-semibold tabular-nums" style={{ color: f.color }}>{formatUsd(f.value)}</span>
                  </div>
                  <div className="h-2 bg-[#171f32] rounded-full overflow-hidden">
                    <div className="h-full rounded-full opacity-80" style={{ width: `${Math.min(f.pct, 100)}%`, backgroundColor: f.color }} />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1 text-right tabular-nums">{f.pct}% of $5.5M quarterly target</p>
                </div>
              ))}
            </div>
          </div>

          {/* Deal Velocity Trends */}
          <div className="rounded-lg bg-[#131b2d] p-5">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-base font-medium text-white">Deal Velocity Trends</h2>
              <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[#b4c5ff]/10 text-[#b4c5ff] font-mono">Copper</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">Average days per stage over 90d</p>

            <div className="space-y-4">
              {data.velocityTrends.map((v) => {
                const improving = v.days <= v.prevDays;
                return (
                  <div key={v.stage}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] text-slate-400">{v.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums" style={{ color: v.color }}>{v.days}d</span>
                        <span className={`text-[10px] tabular-nums ${improving ? "text-emerald-400" : "text-red-400"}`}>
                          {improving ? "↓" : "↑"}{Math.abs(v.days - v.prevDays)}d
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#171f32] rounded-full overflow-hidden">
                      <div className="h-full rounded-full opacity-70" style={{ width: `${(v.days / 15) * 100}%`, backgroundColor: v.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-md bg-emerald-400/5 border border-emerald-400/20 px-4 py-3">
              <p className="text-sm text-emerald-400 font-medium">
                Total Cycle: {data.kpis.totalCycleDays} days (was {data.kpis.prevCycleDays})
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {Math.round(((data.kpis.prevCycleDays - data.kpis.totalCycleDays) / data.kpis.prevCycleDays) * 100)}% improvement quarter-over-quarter
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────
function KPICard({ label, value, sub, trend, color }: {
  label: string; value: string; sub: string; trend: "up" | "down"; color: string;
}) {
  return (
    <div className={`rounded-lg bg-[#131b2d] border-t-2 ${color} p-4 flex flex-col gap-2`}>
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{label}</span>
      <p className="text-2xl font-light tabular-nums text-white">{value}</p>
      <p className="text-[11px] text-slate-500">
        <span className={trend === "up" ? "text-emerald-400" : "text-red-400"}>
          {trend === "up" ? "↑" : "↓"}
        </span>{" "}
        {sub}
      </p>
    </div>
  );
}
