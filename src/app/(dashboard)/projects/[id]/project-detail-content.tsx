"use client";

import Link from "next/link";
import type { DemoProject, DemoProjectPhase, DemoProjectMilestone } from "@/lib/data/demo/projects";
import type { DemoCustomer } from "@/lib/data/demo/customers";

function formatUsd(cents: number): string {
  const n = cents / 100;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toFixed(0)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

const PROJECT_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  scoping: { bg: "bg-blue-400/10", text: "text-blue-300" },
  active: { bg: "bg-emerald-400/10", text: "text-emerald-300" },
  on_hold: { bg: "bg-amber-400/10", text: "text-amber-300" },
  completed: { bg: "bg-slate-500/10", text: "text-slate-400" },
  cancelled: { bg: "bg-red-400/10", text: "text-red-300" },
};

const PHASE_STATUS_STYLE: Record<string, { bg: string; text: string; bar: string }> = {
  not_started: { bg: "bg-slate-500/10", text: "text-slate-400", bar: "bg-slate-700" },
  in_progress: { bg: "bg-blue-400/10", text: "text-blue-300", bar: "bg-blue-500" },
  at_risk: { bg: "bg-amber-400/10", text: "text-amber-300", bar: "bg-amber-500" },
  completed: { bg: "bg-emerald-400/10", text: "text-emerald-300", bar: "bg-emerald-500" },
  blocked: { bg: "bg-red-400/10", text: "text-red-300", bar: "bg-red-500" },
};

const MILESTONE_STATUS_STYLE: Record<string, { dot: string; ring: string; text: string; label: string }> = {
  upcoming: { dot: "bg-slate-600", ring: "ring-slate-700", text: "text-slate-400", label: "Upcoming" },
  at_risk: { dot: "bg-amber-400", ring: "ring-amber-400/30", text: "text-amber-300", label: "At risk" },
  hit: { dot: "bg-emerald-400", ring: "ring-emerald-400/30", text: "text-emerald-300", label: "Hit" },
  missed: { dot: "bg-red-400", ring: "ring-red-400/30", text: "text-red-300", label: "Missed" },
  blown: { dot: "bg-red-500", ring: "ring-red-500/30", text: "text-red-400", label: "Blown" },
};

export function ProjectDetailContent({
  project,
  customer,
  phases,
  milestones,
}: {
  project: DemoProject;
  customer: DemoCustomer;
  phases: DemoProjectPhase[];
  milestones: DemoProjectMilestone[];
}) {
  const statusStyle = PROJECT_STATUS_STYLE[project.status] ?? PROJECT_STATUS_STYLE.active;

  const nextMilestone = milestones.find((m) => m.status === "upcoming" || m.status === "at_risk");
  const atRiskMilestones = milestones.filter((m) => m.status === "at_risk");

  const marginPct = project.recognizedRevenueCents > 0
    ? ((project.marginCents / project.recognizedRevenueCents) * 100).toFixed(1)
    : "—";

  return (
    <div className="px-4 lg:px-12 pt-8 pb-24 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href={`/customers/${customer.id}`}
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-4 transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        {customer.name}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-serif text-3xl text-blue-100">{project.name}</h1>
              <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest rounded ${statusStyle.bg} ${statusStyle.text}`}>
                {project.status.replace("_", " ")}
              </span>
            </div>
            {project.code && (
              <p className="text-xs text-slate-600 mt-1 font-mono">{project.code}</p>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mt-3 max-w-4xl">
          {project.description}
        </p>
        <div className="flex gap-6 mt-4 text-xs text-slate-500 flex-wrap">
          <span>Ops Lead: <span className="text-slate-300">{project.leadOps}</span></span>
          <span>Commercial Lead: <span className="text-slate-300">{project.leadCommercial}</span></span>
          <span>{formatDate(project.startDate)} → {formatDate(project.targetCompletionDate)}</span>
        </div>
      </div>

      {/* At-risk callout */}
      {atRiskMilestones.length > 0 && (
        <div className="mb-6 p-4 bg-amber-500/5 border border-amber-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-400 text-xl mt-0.5">warning</span>
            <div className="flex-1">
              <p className="text-sm text-amber-200 font-medium mb-1">
                {atRiskMilestones.length} milestone{atRiskMilestones.length > 1 ? "s" : ""} at risk
              </p>
              {atRiskMilestones.map((m) => (
                <div key={m.id} className="text-xs text-amber-300/80 mt-1">
                  <span className="font-medium">{m.name}</span> — {m.daysSlack ?? 0}d slack · target {formatDate(m.targetDate)}
                  {m.notes && <p className="text-amber-200/60 mt-0.5">{m.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Total Contract</p>
          <p className="font-serif text-2xl text-blue-100">{formatUsd(project.totalContractCents)}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Recognized</p>
          <p className="font-serif text-2xl text-blue-100">{formatUsd(project.recognizedRevenueCents)}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Margin</p>
          <p className="font-serif text-2xl text-emerald-300">{formatUsd(project.marginCents)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{marginPct}% on recognized</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Next Milestone</p>
          {nextMilestone ? (
            <>
              <p className={`font-serif text-2xl ${nextMilestone.status === "at_risk" ? "text-amber-300" : "text-blue-100"}`}>
                {nextMilestone.daysSlack ?? 0}d
              </p>
              <p className="text-[10px] text-slate-500 mt-1 truncate">slack · {formatDateShort(nextMilestone.targetDate)}</p>
            </>
          ) : (
            <p className="font-serif text-2xl text-slate-400">—</p>
          )}
        </div>
      </div>

      {/* Capacity / Acres summary (if applicable) */}
      {(project.totalCapacityMw || project.totalAcres) && (
        <div className="mb-8 p-4 bg-slate-900/40 border border-slate-800/50 rounded-xl flex gap-8 flex-wrap">
          {project.totalCapacityMw && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Total Capacity</p>
              <p className="font-serif text-xl text-blue-100">{project.totalCapacityMw.toLocaleString()} MW</p>
            </div>
          )}
          {project.totalAcres && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Footprint</p>
              <p className="font-serif text-xl text-blue-100">{project.totalAcres.toLocaleString()} acres</p>
            </div>
          )}
        </div>
      )}

      {/* MW Milestone Spine — power ramp dashboard */}
      {milestones.length > 0 && (
        <div className="mb-8 bg-slate-900/40 border border-slate-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-lg text-blue-100">Milestone Spine</h3>
              <p className="text-xs text-slate-500 mt-1">
                {project.totalCapacityMw ? "Power ramp schedule — every shipment ladders here" : "Delivery cadence"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {milestones.map((m, idx) => {
              const style = MILESTONE_STATUS_STYLE[m.status];
              return (
                <div key={m.id} className="relative">
                  {idx < milestones.length - 1 && (
                    <div className="absolute left-[7px] top-5 bottom-[-16px] w-px bg-slate-800" />
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`relative w-4 h-4 rounded-full ${style.dot} ring-4 ${style.ring} mt-1 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-slate-200 font-medium">{m.name}</p>
                        <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest rounded bg-slate-800/50 ${style.text}`}>
                          {style.label}
                        </span>
                        {m.targetMw && (
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                            {m.targetMw.toLocaleString()} MW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Target {formatDate(m.targetDate)}
                        {m.daysSlack !== undefined && ` · ${m.daysSlack}d slack`}
                        {m.actualDate && ` · actual ${formatDate(m.actualDate)}`}
                      </p>
                      {m.notes && (
                        <p className="text-xs text-amber-300/70 mt-1.5 italic">{m.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Phases */}
      {phases.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-6">
          <h3 className="font-serif text-lg text-blue-100 mb-4">Phases</h3>
          <div className="space-y-3">
            {phases.map((p) => {
              const style = PHASE_STATUS_STYLE[p.status];
              return (
                <div key={p.id} className="p-4 bg-slate-950/40 border border-slate-800/30 rounded-lg">
                  <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">#{p.sequence}</span>
                      <p className="text-sm text-slate-200 font-medium">{p.name}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest rounded ${style.bg} ${style.text}`}>
                      {p.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{p.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 uppercase tracking-widest flex-wrap">
                    <span>{formatDate(p.startDate)} → {formatDate(p.targetCompletionDate)}</span>
                    {p.targetMw && <span className="text-blue-300/70">{p.targetMw.toLocaleString()} MW target</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vendor-aware footer note */}
      <p className="mt-8 text-[10px] text-slate-600 text-center max-w-xl mx-auto">
        Phase-level program view. Shipment-level status, exceptions, and per-shipment margin
        are sourced from Pallet (read-integration, Phase 2).
      </p>
    </div>
  );
}
