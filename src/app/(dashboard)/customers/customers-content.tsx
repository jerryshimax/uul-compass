"use client";

import { useState } from "react";
import Link from "next/link";
import type { DemoCustomer } from "@/lib/data/demo/customers";

function formatUsd(cents: number): string {
  const n = cents / 100;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toFixed(0)}`;
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const VERTICAL_LABEL: Record<string, string> = {
  ai_infrastructure: "AI Data Centers",
  renewable_energy: "Renewable Energy",
  advanced_manufacturing: "Adv. Manufacturing",
  automotive: "Automotive",
  construction: "Construction",
  consumer_goods: "Consumer Goods",
};

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-emerald-400/10", text: "text-emerald-300", label: "Active" },
  prospect: { bg: "bg-blue-400/10", text: "text-blue-300", label: "Prospect" },
  inactive: { bg: "bg-slate-500/10", text: "text-slate-400", label: "Inactive" },
  suspended: { bg: "bg-amber-400/10", text: "text-amber-300", label: "Suspended" },
  churned: { bg: "bg-red-400/10", text: "text-red-300", label: "Churned" },
};

export function CustomersContent({
  customers,
  projectCountByCustomer,
}: {
  customers: DemoCustomer[];
  projectCountByCustomer: Record<string, number>;
}) {
  const [filter, setFilter] = useState<"all" | "strategic" | "active">("strategic");

  const filtered = customers.filter((c) => {
    if (filter === "strategic") return c.isStrategic;
    if (filter === "active") return c.status === "active";
    return true;
  });

  const totalRevenue = customers.reduce((sum, c) => sum + c.revenueLtmCents, 0);
  const totalAr = customers.reduce((sum, c) => sum + c.openArCents, 0);
  const totalMargin = customers.reduce((sum, c) => sum + c.marginYtdCents, 0);

  return (
    <div className="px-4 lg:px-12 pt-8 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Strategic Context</p>
        <h1 className="font-serif text-3xl text-blue-100">Customers</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl">
          Board-grade view of UUL&apos;s customer relationships. Strategic accounts are
          surfaced first; full CRM details live in the detail view.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">LTM Revenue</p>
          <p className="font-serif text-2xl text-blue-100">{formatUsd(totalRevenue)}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Open AR</p>
          <p className="font-serif text-2xl text-amber-300">{formatUsd(totalAr)}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">YTD Margin</p>
          <p className="font-serif text-2xl text-emerald-300">{formatUsd(totalMargin)}</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6">
        {(["strategic", "active", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${
              filter === f
                ? "bg-[#b4c5ff] text-[#0b1325]"
                : "bg-slate-900/40 text-slate-400 hover:text-slate-200 border border-slate-800/50"
            }`}
          >
            {f === "strategic" ? "Strategic" : f === "active" ? "Active" : "All"}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-slate-500">
          {filtered.length} of {customers.length}
        </span>
      </div>

      {/* Customer list */}
      <div className="space-y-3">
        {filtered.map((c) => {
          const projectCount = projectCountByCustomer[c.id] ?? 0;
          const style = STATUS_STYLE[c.status];
          return (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="block bg-slate-900/40 border border-slate-800/50 rounded-xl p-5 hover:bg-slate-900/70 hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {c.isStrategic && (
                      <span className="material-symbols-outlined text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    )}
                    <h3 className="font-serif text-lg text-blue-100 truncate">{c.name}</h3>
                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest rounded ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {VERTICAL_LABEL[c.vertical] ?? c.vertical} · {c.publicBrand} · Owner: {c.accountOwner}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">LTM Revenue</p>
                  <p className="font-serif text-lg text-blue-100">{formatUsd(c.revenueLtmCents)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-800/50">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">YTD Margin</p>
                  <p className="text-sm text-emerald-300 font-medium">{formatUsd(c.marginYtdCents)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Open AR</p>
                  <p className="text-sm text-amber-300 font-medium">{formatUsd(c.openArCents)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Projects</p>
                  <p className="text-sm text-slate-200 font-medium">{projectCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Last Touch</p>
                  <p className="text-sm text-slate-200 font-medium">{formatRelativeDate(c.lastTouchAt)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
