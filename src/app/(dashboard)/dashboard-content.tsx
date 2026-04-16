"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { OverdueCard, WeekCard, groupTasks } from "./my-tasks/my-tasks-content";
import type {
  PhaseData,
  DecisionGate,
  TaskData,
  FinancialPulseMetric,
  PillarMetric,
  WorkstreamData,
} from "@/lib/data";
import type { TranslationKey } from "@/lib/i18n/translations";

// ─── Types ───────────────────────────────────────────────────────

interface DashboardContentProps {
  currentDay: number;
  stats: { total: number; done: number; active: number; blocked: number; overdue: number };
  phases: PhaseData[];
  gates: DecisionGate[];
  attentionItems: {
    id: string;
    type: "gate" | "task";
    title: string;
    subtitle: string;
    badge: string;
    badgeColor: string;
    borderColor: string;
    taskCode?: string;
    workstreamColor?: string;
  }[];
  financialPulse: FinancialPulseMetric[];
  pillars: PillarMetric[];
  myTasks: TaskData[];
  allTasks: TaskData[];
  workstreams: WorkstreamData[];
}

// ─── Shared display constants ─────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  green: "bg-emerald-400",
  amber: "bg-amber-400",
  red: "bg-red-400",
  gray: "bg-slate-600",
};

const STATUS_TEXT: Record<string, string> = {
  green: "text-emerald-400",
  amber: "text-amber-400",
  red: "text-red-400",
  gray: "text-slate-500",
};

const TREND_ICONS: Record<string, { icon: string; color: string }> = {
  up: { icon: "trending_up", color: "text-emerald-400" },
  down: { icon: "trending_down", color: "text-red-400" },
  flat: { icon: "trending_flat", color: "text-slate-500" },
};

const WORKSTREAM_KEYS: Record<string, TranslationKey> = {
  "Finance": "ws_Finance",
  "Operations": "ws_Operations",
  "Sales": "ws_Sales",
  "Brand & Marketing": "ws_BrandMarketing",
  "Technology & AI": "ws_TechnologyAI",
  "Organization & HR": "ws_OrgHR",
};

// ─── AttentionRow ─────────────────────────────────────────────────

type AttentionItem = {
  id: string;
  type: "gate" | "task";
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  borderColor: string;
  taskCode?: string;
  workstreamColor?: string;
};

function AttentionRow({ item, t }: { item: AttentionItem; t: (k: Parameters<ReturnType<typeof useLanguage>["t"]>[0]) => string }) {
  const href = item.type === "task" ? `/tasks/${item.id}` : "/decisions";
  const badgeLabel =
    item.badge === "Critical" ? t("dash_critical") :
    item.badge === "Blocked"  ? t("status_blocked") :
    item.badge === "Overdue"  ? t("dash_overdue") :
    item.badge.startsWith("Day ") ? `${t("plan_day")} ${item.badge.slice(4)}` :
    item.badge;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#171f32] active:opacity-75 transition-colors border-b border-slate-800/40 last:border-b-0 group"
    >
      {item.type === "gate" ? (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#dfc299] shrink-0 w-14 md:w-16">
          {t("dash_gate")}
        </span>
      ) : (
        <span className="text-[10px] font-mono text-slate-600 shrink-0 w-14 md:w-16 truncate">
          {item.taskCode}
        </span>
      )}
      <span className="flex-1 min-w-0 text-sm text-slate-200 truncate group-hover:text-white transition-colors">
        {item.title}
      </span>
      <span className="text-[11px] text-slate-500 shrink-0 truncate max-w-[160px] hidden sm:block">
        {item.subtitle}
      </span>
      {item.type === "task" && item.workstreamColor && (
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: item.workstreamColor }} />
      )}
      <span className={`text-[9px] uppercase tracking-wider font-semibold shrink-0 ${item.badgeColor}`}>
        {badgeLabel}
      </span>
      <span className="material-symbols-outlined text-slate-700 text-sm shrink-0 group-hover:text-slate-500 transition-colors">
        chevron_right
      </span>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────

export function DashboardContent({
  currentDay,
  stats,
  phases,
  gates,
  attentionItems,
  financialPulse,
  pillars,
  myTasks,
  allTasks,
  workstreams,
}: DashboardContentProps) {
  const { t } = useLanguage();
  const completionPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const daysRemaining = Math.max(0, 100 - currentDay);

  // ── Project Tasks state ──────────────────────────────────────
  const [activePhaseNum, setActivePhaseNum] = useState<1 | 2 | 3>(1);

  // ── My Queue ─────────────────────────────────────────────────
  const { overdue: myOverdue, thisWeek: myThisWeek, later: myLater } = groupTasks(myTasks);
  const myActiveCount = myTasks.filter((t) => t.status !== "done").length;

  // Workstream health data
  const wsHealth = workstreams.map((ws) => {
    const wsTasks = allTasks.filter((t) => t.workstream === ws.name && t.phase === activePhaseNum);
    const done = wsTasks.filter((t) => t.status === "done").length;
    const blocked = wsTasks.filter((t) => t.status === "blocked").length;
    const total = wsTasks.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...ws, done, blocked, total, pct };
  }).filter((ws) => ws.total > 0);

  return (
    <div className="space-y-10">
      {/* ── Section 1: Hero ─────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h1 className="font-serif text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.1]">
              {t("dash_dayPrefix")} {currentDay}<span className="text-slate-500"> {t("dash_of100")}</span>
            </h1>
            <p className="mt-3 text-lg text-[#dfc299] font-serif italic">
              {daysRemaining} {t("dash_daysRemaining")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { icon: "schedule", color: "text-amber-400", count: stats.overdue, labelKey: "dash_overdue" as const },
              { icon: "block", color: "text-red-400", count: stats.blocked, labelKey: "dash_blocked" as const },
              { icon: "play_circle", color: "text-[#b4c5ff]", count: stats.active, labelKey: "dash_inProgress" as const },
              { icon: "check_circle", color: "text-emerald-400", count: stats.done, labelKey: "dash_completed" as const },
            ].map((pill) => (
              <span key={pill.labelKey} className="inline-flex items-center gap-2 rounded-full bg-[#131b2d] px-4 py-2 text-sm">
                <span className={`material-symbols-outlined ${pill.color} text-base`}>{pill.icon}</span>
                <span className="tabular-nums font-medium text-white">{pill.count}</span>
                <span className="text-slate-500">{t(pill.labelKey)}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col items-end text-right space-y-4">
          <p className="font-serif text-7xl lg:text-8xl font-light tabular-nums text-white tracking-tight">
            {completionPct}
            <span className="text-4xl text-slate-500">%</span>
          </p>
          <div className="w-full max-w-xs">
            <div className="h-2 rounded-full bg-[#171f32] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#b4c5ff] transition-all duration-700"
                style={{ width: `${Math.max(completionPct, 1)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 tabular-nums">
              {stats.done} {t("dash_of")} {stats.total} {t("dash_tasksComplete")}
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2: Phase Timeline ──────────────────────── */}
      <section className="rounded-lg bg-[#131b2d] p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#dfc299] text-lg">timeline</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {t("dash_integrationTimeline")}
          </span>
        </div>

        <div className="relative">
          <div className="flex h-10 rounded-lg overflow-hidden">
            {phases.map((phase) => {
              const widthPct = ((phase.endDay - phase.startDay + 1) / 100) * 100;
              const isActive = currentDay >= phase.startDay && currentDay <= phase.endDay;
              return (
                <div
                  key={phase.id}
                  className={`relative flex items-center px-3 ${
                    isActive ? "bg-[#1a2744]" : "bg-[#171f32]"
                  } ${phase.phaseNumber < 3 ? "border-r border-slate-700/50" : ""}`}
                  style={{ width: `${widthPct}%` }}
                >
                  <span className={`text-[10px] uppercase tracking-wider truncate ${
                    isActive ? "text-[#b4c5ff] font-semibold" : "text-slate-600"
                  }`}>
                    {phase.name}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="absolute top-0 h-10 w-0.5 bg-[#b4c5ff]" style={{ left: `${currentDay}%` }}>
            <div className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full bg-[#b4c5ff] border-2 border-[#131b2d]" />
          </div>

          {gates.map((gate) => (
            <div
              key={gate.id}
              className="absolute top-full mt-1"
              style={{ left: `${gate.dayNumber}%`, transform: "translateX(-50%)" }}
            >
              <div className="flex flex-col items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-[#dfc299]" />
                <span className="text-[9px] text-slate-600 tabular-nums mt-0.5">{gate.dayNumber}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex mt-6 gap-4">
          {phases.map((phase) => {
            const isActive = currentDay >= phase.startDay && currentDay <= phase.endDay;
            return (
              <div key={phase.id} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${isActive ? "bg-[#b4c5ff]" : "bg-slate-700"}`} />
                <span className={`text-[11px] ${isActive ? "text-slate-300" : "text-slate-600"}`}>
                  {t("dash_phase")} {phase.phaseNumber}: {phase.startDate} – {phase.endDate}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 3: My Queue ──────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-[#b4c5ff] text-lg">assignment_turned_in</span>
          <h2 className="font-serif text-2xl text-white">{t("dash_myQueue")}</h2>
          {myActiveCount > 0 && (
            <span className="ml-2 rounded-full bg-[#b4c5ff]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#b4c5ff]">
              {myActiveCount}
            </span>
          )}
          <Link
            href="/my-tasks"
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#131b2d] hover:bg-[#171f32] border border-slate-700/40 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            {t("dash_viewAll")}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {myTasks.length === 0 ? (
          <div className="rounded-lg bg-[#131b2d] p-5 text-sm text-slate-500">
            {t("dash_noAssignedTasks")}
          </div>
        ) : myOverdue.length === 0 && myThisWeek.length === 0 ? (
          /* Only later tasks — show a single summary card rather than an empty section */
          <Link
            href="/my-tasks"
            className="flex items-center justify-between rounded-lg bg-[#131b2d] border border-slate-700/40 px-5 py-4 hover:bg-[#171f32] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-500 text-lg">schedule</span>
              <div>
                <p className="text-sm text-slate-300">
                  {myLater.length} {t("dash_moreLater")}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">{t("dash_nothingUrgent")}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-600 text-lg">chevron_right</span>
          </Link>
        ) : (
          <div className="space-y-3">
            {myOverdue.map((task) => <OverdueCard key={task.id} task={task} />)}
            {myThisWeek.map((task) => <WeekCard key={task.id} task={task} />)}
            {myLater.length > 0 && (
              <Link
                href="/my-tasks"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-[#131b2d]/60 border border-slate-800/50 border-dashed px-4 py-3 text-[12px] text-slate-500 hover:text-slate-300 hover:bg-[#131b2d] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">schedule</span>
                + {myLater.length} {t("dash_moreLater")}
                <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── Section 4: Needs Attention ─────────────────────── */}
      {(() => {
        const blockedItems  = attentionItems.filter((i) => i.badge === "Blocked");
        const criticalItems = attentionItems.filter((i) => i.badge === "Critical");
        const overdueItems  = attentionItems.filter((i) => i.badge === "Overdue");
        const gateItems     = attentionItems.filter((i) => i.type === "gate");
        const urgentCount   = blockedItems.length + criticalItems.length;

        return (
          <section>
            {/* Header with RAG summary badges */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="material-symbols-outlined text-amber-400 text-lg">priority_high</span>
              <h2 className="font-serif text-2xl text-white">{t("dash_needsAttention")}</h2>
              {urgentCount > 0 && (
                <span className="rounded-full bg-red-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-400">
                  {urgentCount} {t("dash_attn_urgent")}
                </span>
              )}
              {overdueItems.length > 0 && (
                <span className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  {overdueItems.length} {t("dash_overdue")}
                </span>
              )}
              {gateItems.length > 0 && (
                <span className="rounded-full bg-[#dfc299]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#dfc299]">
                  {gateItems.length} {t("dash_attn_gates")}
                </span>
              )}
            </div>

            {attentionItems.length === 0 ? (
              <div className="rounded-lg bg-[#131b2d] p-5 text-sm text-slate-500">
                {t("dash_allClear")}
              </div>
            ) : (
              <div className="rounded-lg bg-[#131b2d] overflow-hidden">
                {/* Blocked + Critical group */}
                {[...blockedItems, ...criticalItems].length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-red-400/5 border-b border-slate-800/60 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-red-400">
                        {t("dash_attn_urgentLabel")}
                      </span>
                    </div>
                    {[...blockedItems, ...criticalItems].map((item) => (
                      <AttentionRow key={item.id} item={item} t={t} />
                    ))}
                  </div>
                )}

                {/* Overdue group */}
                {overdueItems.length > 0 && (
                  <div className={[...blockedItems, ...criticalItems].length > 0 ? "border-t border-slate-800/60" : ""}>
                    <div className="px-4 py-2 bg-amber-400/5 border-b border-slate-800/60 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-amber-400">
                        {t("dash_overdue")}
                      </span>
                    </div>
                    {overdueItems.map((item) => (
                      <AttentionRow key={item.id} item={item} t={t} />
                    ))}
                  </div>
                )}

                {/* Decision Gates group */}
                {gateItems.length > 0 && (
                  <div className={attentionItems.length > gateItems.length ? "border-t border-slate-800/60" : ""}>
                    <div className="px-4 py-2 bg-[#dfc299]/5 border-b border-slate-800/60 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#dfc299] shrink-0" />
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-[#dfc299]">
                        {t("dash_attn_gatesLabel")}
                      </span>
                    </div>
                    {gateItems.map((item) => (
                      <AttentionRow key={item.id} item={item} t={t} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })()}

      {/* ── Section 5: Project Tasks ───────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-lg">task_alt</span>
            <h2 className="font-serif text-2xl text-white">{t("dash_projectTasks")}</h2>
          </div>
          <Link
            href="/plan"
            className="flex items-center gap-1.5 rounded-lg bg-[#131b2d] hover:bg-[#171f32] border border-slate-700/40 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            {t("dash_viewAllTasks")}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {/* Phase pills */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {phases.map((phase) => {
            const isSelected = phase.phaseNumber === activePhaseNum;
            const phaseTasks = allTasks.filter((task) => task.phase === phase.phaseNumber);
            const phaseDone = phaseTasks.filter((task) => task.status === "done").length;
            const phasePct = phaseTasks.length > 0 ? Math.round((phaseDone / phaseTasks.length) * 100) : 0;
            return (
              <button
                key={phase.id}
                onClick={() => setActivePhaseNum(phase.phaseNumber as 1 | 2 | 3)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-medium transition-all border ${
                  isSelected
                    ? "bg-[#1a2744] border-[#b4c5ff]/30 text-[#b4c5ff]"
                    : "bg-[#131b2d] border-slate-700/40 text-slate-500 hover:text-slate-300"
                }`}
              >
                <span>{t("plan_phase")} {phase.phaseNumber}</span>
                <span className={`tabular-nums ${isSelected ? "text-[#b4c5ff]/70" : "text-slate-600"}`}>{phasePct}%</span>
              </button>
            );
          })}
        </div>

        {/* Workstream health rows */}
        <div className="rounded-lg bg-[#131b2d] overflow-hidden">
          {wsHealth.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">{t("plan_noTasks")}</div>
          ) : (
            wsHealth.map((ws, i) => (
              <div
                key={ws.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < wsHealth.length - 1 ? "border-b border-slate-800/40" : ""}`}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: ws.color }} />
                <span className="text-[11px] font-medium text-slate-300 w-24 md:w-36 truncate shrink-0">
                  {WORKSTREAM_KEYS[ws.name] ? t(WORKSTREAM_KEYS[ws.name]) : ws.name}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-[#171f32] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#b4c5ff] transition-all"
                    style={{ width: `${Math.max(ws.pct, ws.total > 0 ? 1 : 0)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 tabular-nums shrink-0 w-10 text-right">{ws.done}/{ws.total}</span>
                {ws.blocked > 0 && (
                  <span className="text-[9px] font-semibold text-red-400 bg-red-400/10 rounded px-1.5 py-0.5 shrink-0">
                    {ws.blocked} blocked
                  </span>
                )}
              </div>
            ))
          )}
        </div>

      </section>

      {/* ── Section 6: Financial Pulse ─────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-2xl text-white">{t("dash_financialPulse")}</h2>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">{t("dash_liveData")}</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {financialPulse.map((metric) => (
            <div key={metric.id} className="rounded-lg bg-[#131b2d] border-t-2 border-[#dfc299] p-4 flex flex-col gap-3">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                {metric.label}
              </span>
              <div className="flex items-end gap-2">
                <p className={`text-2xl font-light tabular-nums ${STATUS_TEXT[metric.status]}`}>
                  {metric.value}
                </p>
                {metric.trend && (
                  <span className={`material-symbols-outlined text-base mb-1 ${TREND_ICONS[metric.trend].color}`}>
                    {TREND_ICONS[metric.trend].icon}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">{metric.subLabel}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 7: Strategic Pillars ───────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-2xl text-white">{t("dash_strategicPillars")}</h2>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">
            {t("dash_100dayPriorities")}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((pillar) => (
            <div key={pillar.id} className="rounded-lg bg-[#131b2d] border-t-2 border-[#dfc299] p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-slate-500 text-lg">{pillar.icon}</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                    {pillar.name}
                  </span>
                </div>
                <span className={`h-2 w-2 rounded-full ${STATUS_DOT[pillar.overallStatus]}`} />
              </div>

              <div>
                <p className={`text-3xl font-light tabular-nums ${STATUS_TEXT[pillar.overallStatus]}`}>
                  {pillar.headline}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{pillar.headlineLabel}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/50">
                {pillar.subItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[item.status]}`} />
                      <span className="text-[12px] text-slate-400 truncate">{item.label}</span>
                    </div>
                    <span className={`text-[11px] tabular-nums shrink-0 ${STATUS_TEXT[item.status]}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
