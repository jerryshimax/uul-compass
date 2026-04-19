"use client";

import { useState } from "react";
import Link from "next/link";
import type { DemoCustomer } from "@/lib/data/demo/customers";
import type { DemoProject } from "@/lib/data/demo/projects";

function formatUsd(cents: number): string {
  const n = cents / 100;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toFixed(0)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const VERTICAL_LABEL: Record<string, string> = {
  ai_infrastructure: "AI Data Centers",
  renewable_energy: "Renewable Energy",
  advanced_manufacturing: "Advanced Manufacturing",
  automotive: "Automotive",
  construction: "Construction",
  consumer_goods: "Consumer Goods",
};

const PROJECT_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  scoping: { bg: "bg-blue-400/10", text: "text-blue-300" },
  active: { bg: "bg-emerald-400/10", text: "text-emerald-300" },
  on_hold: { bg: "bg-amber-400/10", text: "text-amber-300" },
  completed: { bg: "bg-slate-500/10", text: "text-slate-400" },
  cancelled: { bg: "bg-red-400/10", text: "text-red-300" },
};

export function CustomerDetailContent({
  customer,
  projects,
}: {
  customer: DemoCustomer;
  projects: DemoProject[];
}) {
  const [tab, setTab] = useState<"overview" | "projects" | "notes">("overview");

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "projects" as const, label: `Projects (${projects.length})` },
    { id: "notes" as const, label: "Strategic Notes" },
  ];

  return (
    <div className="px-4 lg:px-12 pt-8 pb-24 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href="/customers"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-4 transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Customers
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          {customer.isStrategic && (
            <span className="material-symbols-outlined text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
          )}
          <h1 className="font-serif text-3xl text-blue-100">{customer.name}</h1>
        </div>
        <p className="text-sm text-slate-400">
          {VERTICAL_LABEL[customer.vertical] ?? customer.vertical} · {customer.publicBrand} · Owner: {customer.accountOwner}
        </p>
        {customer.legalName && (
          <p className="text-xs text-slate-600 mt-1">Legal: {customer.legalName}</p>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">YTD Revenue</p>
          <p className="font-serif text-2xl text-blue-100">{formatUsd(customer.revenueYtdCents)}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">LTM Revenue</p>
          <p className="font-serif text-2xl text-blue-100">{formatUsd(customer.revenueLtmCents)}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">YTD Margin</p>
          <p className="font-serif text-2xl text-emerald-300">{formatUsd(customer.marginYtdCents)}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Open AR</p>
          <p className="font-serif text-2xl text-amber-300">{formatUsd(customer.openArCents)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-800/50">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`px-4 py-3 text-sm font-medium tracking-wide transition-all border-b-2 -mb-px ${
              tab === tabItem.id
                ? "text-blue-200 border-blue-500"
                : "text-slate-500 border-transparent hover:text-slate-300"
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-6">
            <h3 className="font-serif text-lg text-blue-100 mb-4">Strategic Context</h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {customer.strategicNotes}
            </p>
          </div>

          {projects.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-6">
              <h3 className="font-serif text-lg text-blue-100 mb-4">Active Programs</h3>
              <div className="space-y-3">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="block p-4 bg-slate-950/40 border border-slate-800/30 rounded-lg hover:border-blue-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-sm text-slate-200 font-medium">{p.name}</p>
                      <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest rounded ${PROJECT_STATUS_STYLE[p.status]?.bg} ${PROJECT_STATUS_STYLE[p.status]?.text}`}>
                        {p.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDate(p.startDate)} → {formatDate(p.targetCompletionDate)} ·
                      Contract {formatUsd(p.totalContractCents)} ·
                      Recognized {formatUsd(p.recognizedRevenueCents)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "projects" && (
        <div className="space-y-3">
          {projects.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">No projects yet.</p>
          ) : (
            projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="block bg-slate-900/40 border border-slate-800/50 rounded-xl p-5 hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="font-serif text-lg text-blue-100">{p.name}</h3>
                    {p.code && <p className="text-xs text-slate-500 mt-0.5">{p.code}</p>}
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest rounded ${PROJECT_STATUS_STYLE[p.status]?.bg} ${PROJECT_STATUS_STYLE[p.status]?.text}`}>
                    {p.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{p.description}</p>
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
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Target</p>
                    <p className="text-sm text-slate-200 font-medium">{formatDate(p.targetCompletionDate)}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "notes" && (
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-6">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {customer.strategicNotes}
          </p>
          <div className="mt-6 pt-4 border-t border-slate-800/50">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Last touch</p>
            <p className="text-sm text-slate-300 mt-1">
              {new Date(customer.lastTouchAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
