"use client";

import { useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

type FeedbackType = "bug" | "idea" | "question" | "praise";
type FeedbackStatus = "open" | "triaged" | "in_progress" | "resolved" | "wont_fix";

export type FeedbackRow = {
  id: string;
  type: FeedbackType;
  body: string;
  status: FeedbackStatus;
  pageUrl: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
};

export type AiUsageRow = {
  id: string;
  userName: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  createdAt: string;
};

// ─── Config ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<FeedbackType, { icon: string; label: string; color: string }> = {
  bug:      { icon: "bug_report",   label: "Bug",      color: "text-red-400 bg-red-900/30 border-red-800/50" },
  idea:     { icon: "lightbulb",    label: "Idea",     color: "text-amber-400 bg-amber-900/30 border-amber-800/50" },
  question: { icon: "help_outline", label: "Question", color: "text-blue-400 bg-blue-900/30 border-blue-800/50" },
  praise:   { icon: "thumb_up",     label: "Praise",   color: "text-emerald-400 bg-emerald-900/30 border-emerald-800/50" },
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; dot: string }> = {
  open:        { label: "Open",        dot: "bg-sky-400" },
  triaged:     { label: "Triaged",     dot: "bg-violet-400" },
  in_progress: { label: "In Progress", dot: "bg-amber-400" },
  resolved:    { label: "Resolved",    dot: "bg-emerald-400" },
  wont_fix:    { label: "Won't Fix",   dot: "bg-slate-500" },
};

const STATUS_FILTERS = ["all", "open", "triaged", "in_progress", "resolved", "wont_fix"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

// ─── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Rough cost estimate: Sonnet 4.6 pricing
// Input: $15/1M, Output: $75/1M, Cache read: $1.50/1M, Cache write: $3.75/1M
function estimateCost(row: AiUsageRow): number {
  return (
    (row.inputTokens * 15) / 1_000_000 +
    (row.outputTokens * 75) / 1_000_000 +
    (row.cacheReadTokens * 1.5) / 1_000_000 +
    (row.cacheWriteTokens * 3.75) / 1_000_000
  );
}

// ─── Sections ──────────────────────────────────────────────────────────────

function FeedbackSection({ rows }: { rows: FeedbackRow[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [typeFilter, setTypeFilter] = useState<FeedbackType | "all">("all");

  const filtered = rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s as FeedbackStatus].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {(["all", "bug", "idea", "question", "praise"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === t ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t === "all" ? "All types" : TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-sm text-slate-600">
          No feedback matching these filters.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => {
            const type = TYPE_CONFIG[row.type];
            const status = STATUS_CONFIG[row.status];
            return (
              <div
                key={row.id}
                className="bg-slate-900/60 border border-slate-800/60 rounded-xl px-5 py-4 space-y-2 hover:border-slate-700/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium shrink-0 ${type.color}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>{type.icon}</span>
                      {type.label}
                    </span>
                    <span className="text-xs text-slate-400 truncate">{row.userName}</span>
                    <span className="text-xs text-slate-600 hidden sm:inline">{row.userEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    <span className="text-[11px] text-slate-600">{timeAgo(row.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{row.body}</p>
                {row.pageUrl && (
                  <p className="text-[11px] text-slate-600 truncate">
                    <span className="material-symbols-outlined align-middle mr-1" style={{ fontSize: 12 }}>link</span>
                    {row.pageUrl}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AiUsageSection({ rows }: { rows: AiUsageRow[] }) {
  // Aggregate by user
  const byUser = rows.reduce<Record<string, { name: string; queries: number; inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number; cost: number }>>((acc, row) => {
    if (!acc[row.userName]) {
      acc[row.userName] = { name: row.userName, queries: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, cost: 0 };
    }
    acc[row.userName].queries += 1;
    acc[row.userName].inputTokens += row.inputTokens;
    acc[row.userName].outputTokens += row.outputTokens;
    acc[row.userName].cacheReadTokens += row.cacheReadTokens;
    acc[row.userName].cacheWriteTokens += row.cacheWriteTokens;
    acc[row.userName].cost += estimateCost(row);
    return acc;
  }, {});

  const userRows = Object.values(byUser).sort((a, b) => b.cost - a.cost);
  const totalCost = userRows.reduce((s, r) => s + r.cost, 0);
  const totalQueries = rows.length;
  const totalCacheHitTokens = rows.reduce((s, r) => s + r.cacheReadTokens, 0);
  const totalInputTokens = rows.reduce((s, r) => s + r.inputTokens, 0);
  const cacheHitRate = totalInputTokens > 0
    ? Math.round((totalCacheHitTokens / (totalInputTokens + totalCacheHitTokens)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total queries", value: totalQueries.toLocaleString(), icon: "chat" },
          { label: "Est. total cost", value: `$${totalCost.toFixed(2)}`, icon: "payments" },
          { label: "Cache hit rate", value: `${cacheHitRate}%`, icon: "cached" },
          { label: "Avg cost/query", value: totalQueries > 0 ? `$${(totalCost / totalQueries).toFixed(3)}` : "—", icon: "trending_down" },
        ].map((card) => (
          <div key={card.label} className="bg-slate-900/60 border border-slate-800/60 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 14 }}>{card.icon}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">{card.label}</span>
            </div>
            <p className="text-lg font-bold text-slate-100">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Per-user table */}
      {userRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-sm text-slate-600">
          No AI usage recorded yet.
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-slate-500 font-medium">User</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Queries</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Input tokens</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Output tokens</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Cache hits</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {userRows.map((row) => (
                <tr key={row.name} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-200 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{row.queries}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{row.inputTokens.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{row.outputTokens.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{row.cacheReadTokens.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-200">${row.cost.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────

type Section = "feedback" | "ai_usage";

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "feedback", label: "Feedback", icon: "inbox" },
  { id: "ai_usage", label: "AI Usage", icon: "insights" },
];

export function AdminContent({
  feedbackRows,
  aiUsageRows,
}: {
  feedbackRows: FeedbackRow[];
  aiUsageRows: AiUsageRow[];
}) {
  const [section, setSection] = useState<Section>("feedback");
  const openCount = feedbackRows.filter((r) => r.status === "open").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-500/10">
          <span className="material-symbols-outlined text-violet-400" style={{ fontSize: 20 }}>admin_panel_settings</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">Admin</h1>
          <p className="text-xs text-slate-500">
            {openCount} open feedback · {aiUsageRows.length} AI queries logged
          </p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              section === s.id ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      {section === "feedback" && <FeedbackSection rows={feedbackRows} />}
      {section === "ai_usage" && <AiUsageSection rows={aiUsageRows} />}
    </div>
  );
}
