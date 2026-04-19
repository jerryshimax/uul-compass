"use client";

import { useState } from "react";
import Link from "next/link";
import type { DemoProject } from "@/lib/data/demo/projects";
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

const PROJECT_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  scoping: { bg: "bg-blue-400/10", text: "text-blue-300" },
  active: { bg: "bg-emerald-400/10", text: "text-emerald-300" },
  on_hold: { bg: "bg-amber-400/10", text: "text-amber-300" },
  completed: { bg: "bg-slate-500/10", text: "text-slate-400" },
  cancelled: { bg: "bg-red-400/10", text: "text-red-300" },
};

export function ProjectsContent({
  projects,
  customerById,
  milestonesByProject,
}: {
  projects: DemoProject[];
  customerById: Record<string, DemoCustomer>;
  milestonesByProject: Record<string, { atRisk: number; nextTargetDate?: string; nextSlack?: number }>;
}) {
  const [filter, setFilter] = useState<"all" | "at_risk" | "active">("active");

  const filtered = projects.filter((p) => {
    if (filter === "active") return p.status === "active";
    if (filter === "at_risk") return (milestonesByProject[p.id]?.atRisk ?? 0) > 0;
    return true;
  });

  const totalContract = projects.reduce((sum, p) => sum + p.totalContractCents, 0);
  const totalRecognized = projects.reduce((sum, p) => sum + p.recognizedRevenueCents, 0);
  const totalMargin = projects.reduce((sum, p) => sum + p.marginCents, 0);
  const totalAtRisk = projects.reduce((sum, p) => sum + (milestonesByProject[p.id]?.atRisk ?? 0), 0);

  return (
    <div className="px-4 lg:px-12 pt-8 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Strategic Programs</p>
        <h1 className="font-serif text-3xl text-blue-100">Projects</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl">
          Multi-phase customer programs with milestone schedules. Hyperscale anchor + four
          active programs across renewable, automotive, and grid storage.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Total Contract</p>
          <p className="font-serif text-2xl text-blue-100">{formatUsd(totalContract)}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Recognized</p>
          <p className="font-serif text-2xl text-blue-100">{formatUsd(totalRecognized)}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Margin</p>
          <p className="font-serif text-2xl text-emerald-300">{formatUsd(totalMargin)}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">At-Risk Milestones</p>
          <p className={`font-serif text-2xl ${totalAtRisk > 0 ? "text-amber-300" : "text-slate-400"}`}>
            {totalAtRisk}
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6">
        {(["active", "at_risk", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${
              filter === f
                ? "bg-[#b4c5ff] text-[#0b1325]"
                : "bg-slate-900/40 text-slate-400 hover:text-slate-200 border border-slate-800/50"
            }`}
          >
            {f === "active" ? "Active" : f === "at_risk" ? "At Risk" : "All"}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-slate-500">
          {filtered.length} of {projects.length}
        </span>
      </div>

      {/* Project list */}
      <div className="space-y-3">
        {filtered.map((p) => {
          const customer = customerById[p.customerId];
          const milestones = milestonesByProject[p.id];
          const style = PROJECT_STATUS_STYLE[p.status];
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block bg-slate-900/40 border border-slate-800/50 rounded-xl p-5 hover:bg-slate-900/70 hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-serif text-lg text-blue-100">{p.name}</h3>
                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest rounded ${style.bg} ${style.text}`}>
                      {p.status.replace("_", " ")}
                    </span>
                    {milestones && milestones.atRisk > 0 && (
                      <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest rounded bg-amber-500/10 text-amber-300 inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">warning</span>
                        {milestones.atRisk} at risk
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {customer?.name ?? "Unknown customer"} · {p.leadOps} (ops) · {p.leadCommercial} (commercial)
                  </p>
                </div>
                {p.totalCapacityMw && (
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Capacity</p>
                    <p className="font-serif text-lg text-blue-100">{p.totalCapacityMw.toLocaleString()} MW</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-800/50">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Contract</p>
                  <p className="text-sm text-slate-200 font-medium">{formatUsd(p.totalContractCents)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Recognized</p>
                  <p className="text-sm text-slate-200 font-medium">{formatUsd(p.recognizedRevenueCents)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Margin</p>
                  <p className="text-sm text-emerald-300 font-medium">{formatUsd(p.marginCents)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Next Milestone</p>
                  <p className={`text-sm font-medium ${milestones?.atRisk ? "text-amber-300" : "text-slate-200"}`}>
                    {milestones?.nextTargetDate ? formatDate(milestones.nextTargetDate) : "—"}
                    {milestones?.nextSlack !== undefined && (
                      <span className="text-slate-500"> · {milestones.nextSlack}d</span>
                    )}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
