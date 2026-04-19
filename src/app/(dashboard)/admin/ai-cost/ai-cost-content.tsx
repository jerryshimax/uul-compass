"use client";

import { useState } from "react";
import type {
  DemoAiUserUsage,
  DemoAiToolUsage,
  DemoAiDailySpend,
  DemoAiConversation,
} from "@/lib/data/demo/ai-usage";

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const hours = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AiCostContent({
  budgetCents,
  monthly,
  daily,
  users,
  tools,
  topConversations,
}: {
  budgetCents: number;
  monthly: {
    costCents: number;
    messageCount: number;
    toolCallCount: number;
    tokensIn: number;
    tokensOut: number;
    tokensCached: number;
    activeUsers: number;
    asOfDate: string;
  };
  daily: DemoAiDailySpend[];
  users: DemoAiUserUsage[];
  tools: DemoAiToolUsage[];
  topConversations: DemoAiConversation[];
}) {
  const [tab, setTab] = useState<"users" | "tools" | "conversations">("users");

  const budgetPct = (monthly.costCents / budgetCents) * 100;
  const projectedMonth = (monthly.costCents / 19) * 30;
  const projectedPct = (projectedMonth / budgetCents) * 100;

  const maxDaily = Math.max(...daily.map((d) => d.costCents));
  const cacheRate = ((monthly.tokensCached / (monthly.tokensIn + monthly.tokensCached)) * 100).toFixed(1);

  const tabs = [
    { id: "users" as const, label: "By User" },
    { id: "tools" as const, label: "By Tool" },
    { id: "conversations" as const, label: "Top Conversations" },
  ];

  const sortedUsers = [...users].sort((a, b) => b.costCents - a.costCents);
  const sortedTools = [...tools].sort((a, b) => b.costCents - a.costCents);

  return (
    <div className="px-4 lg:px-12 pt-8 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Admin · Cost Visibility</p>
        <h1 className="font-serif text-3xl text-blue-100">AI Spend</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl">
          Monthly budget tracking for Vercel AI Gateway · Claude Opus 4.6 + GPT-5.4 fallback.
          Per-user, per-tool, and per-conversation drilldown.
        </p>
      </div>

      {/* Budget gauge */}
      <div className="mb-8 bg-slate-900/40 border border-slate-800/50 rounded-xl p-6">
        <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">April 2026 spend</p>
            <p className="font-serif text-4xl text-blue-100">
              {formatUsd(monthly.costCents)} <span className="text-slate-500 text-lg">/ {formatUsd(budgetCents)}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">As of {monthly.asOfDate} · {monthly.activeUsers} active users</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Projected month-end</p>
            <p className={`font-serif text-2xl ${projectedPct > 100 ? "text-red-400" : projectedPct > 85 ? "text-amber-300" : "text-emerald-300"}`}>
              {formatUsd(Math.round(projectedMonth))}
            </p>
            <p className="text-xs text-slate-500 mt-1">{projectedPct.toFixed(0)}% of budget</p>
          </div>
        </div>
        <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 ${budgetPct > 85 ? "bg-amber-500" : "bg-blue-500"}`}
            style={{ width: `${Math.min(budgetPct, 100)}%` }}
          />
          <div className="absolute inset-y-0 left-[63%] w-px bg-slate-600" />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>$0</span>
          <span className="opacity-60">Day 19/30 ({((19 / 30) * 100).toFixed(0)}%)</span>
          <span>{formatUsd(budgetCents)}</span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Messages</p>
          <p className="font-serif text-2xl text-blue-100">{monthly.messageCount.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Tool Calls</p>
          <p className="font-serif text-2xl text-blue-100">{monthly.toolCallCount.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Tokens (in / out)</p>
          <p className="font-serif text-2xl text-blue-100">
            {formatTokens(monthly.tokensIn)} <span className="text-slate-500 text-base">/ {formatTokens(monthly.tokensOut)}</span>
          </p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Cache Hit Rate</p>
          <p className="font-serif text-2xl text-emerald-300">{cacheRate}%</p>
          <p className="text-[10px] text-slate-500 mt-1">{formatTokens(monthly.tokensCached)} cached tokens</p>
        </div>
      </div>

      {/* Daily spend chart */}
      <div className="mb-8 bg-slate-900/40 border border-slate-800/50 rounded-xl p-6">
        <h3 className="font-serif text-lg text-blue-100 mb-4">Daily spend (last 19 days)</h3>
        <div className="flex items-end gap-1 h-32">
          {daily.map((d) => {
            const heightPct = (d.costCents / maxDaily) * 100;
            const day = parseInt(d.date.slice(-2), 10);
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full bg-blue-500/40 hover:bg-blue-500/70 rounded-t transition-all cursor-pointer"
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
                <span className="text-[9px] text-slate-600">{day}</span>
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-200 whitespace-nowrap z-10">
                  {d.date} · {formatUsd(d.costCents)} · {d.messageCount} msgs
                </div>
              </div>
            );
          })}
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

      {tab === "users" && (
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-950/40 border-b border-slate-800/50 text-[10px] text-slate-500 uppercase tracking-widest">
            <div className="col-span-3">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-1 text-right">Messages</div>
            <div className="col-span-1 text-right">Tools</div>
            <div className="col-span-2 text-right">Tokens (in/out)</div>
            <div className="col-span-2 text-right">Cost</div>
            <div className="col-span-1 text-right">Share</div>
          </div>
          {sortedUsers.map((u) => {
            const sharePct = ((u.costCents / monthly.costCents) * 100).toFixed(1);
            return (
              <div
                key={u.userId}
                className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-slate-800/30 last:border-b-0 hover:bg-slate-950/40 transition-colors text-sm"
              >
                <div className="col-span-3 text-slate-200 font-medium">{u.userName}</div>
                <div className="col-span-2 text-slate-500">{u.role}</div>
                <div className="col-span-1 text-right text-slate-300">{u.messageCount}</div>
                <div className="col-span-1 text-right text-slate-300">{u.toolCallCount}</div>
                <div className="col-span-2 text-right text-slate-400 text-xs">
                  {formatTokens(u.tokensIn)} / {formatTokens(u.tokensOut)}
                </div>
                <div className="col-span-2 text-right text-blue-100 font-medium">{formatUsd(u.costCents)}</div>
                <div className="col-span-1 text-right text-slate-500 text-xs">{sharePct}%</div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "tools" && (
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-950/40 border-b border-slate-800/50 text-[10px] text-slate-500 uppercase tracking-widest">
            <div className="col-span-4">Tool</div>
            <div className="col-span-2 text-right">Calls</div>
            <div className="col-span-2 text-right">Success Rate</div>
            <div className="col-span-2 text-right">Avg Latency</div>
            <div className="col-span-2 text-right">Cost</div>
          </div>
          {sortedTools.map((t) => {
            const successPct = ((t.successCount / t.callCount) * 100).toFixed(1);
            return (
              <div
                key={t.toolName}
                className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-slate-800/30 last:border-b-0 hover:bg-slate-950/40 transition-colors text-sm"
              >
                <div className="col-span-4 text-slate-200 font-mono text-xs">{t.toolName}</div>
                <div className="col-span-2 text-right text-slate-300">{t.callCount}</div>
                <div className={`col-span-2 text-right ${parseFloat(successPct) < 95 ? "text-amber-300" : "text-emerald-300"}`}>
                  {successPct}%
                </div>
                <div className="col-span-2 text-right text-slate-400">{t.avgLatencyMs}ms</div>
                <div className="col-span-2 text-right text-blue-100 font-medium">{formatUsd(t.costCents)}</div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "conversations" && (
        <div className="space-y-2">
          {[...topConversations].sort((a, b) => b.costCents - a.costCents).map((c) => (
            <div
              key={c.id}
              className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium">{c.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {c.userName} · {c.messageCount} messages · {formatRelativeTime(c.startedAt)}
                  </p>
                </div>
                <p className="text-blue-100 font-medium font-serif text-lg shrink-0">{formatUsd(c.costCents)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 text-[10px] text-slate-600 text-center max-w-xl mx-auto">
        Demo data · production wires to ai_usage / ai_tool_calls / ai_messages tables.
        Soft caps + model router (Haiku for reads, Opus for writes) target Day 35.
      </p>
    </div>
  );
}
