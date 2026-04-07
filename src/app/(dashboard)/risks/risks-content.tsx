"use client";

import { useLanguage } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { RiskData, TaskData } from "@/lib/data";

const WORKSTREAM_KEYS: Record<string, TranslationKey> = {
  "Finance": "ws_Finance",
  "Operations": "ws_Operations",
  "Sales": "ws_Sales",
  "Brand & Marketing": "ws_BrandMarketing",
  "Technology & AI": "ws_TechnologyAI",
  "Organization & HR": "ws_OrgHR",
};

const severityConfig = {
  high: { border: "border-red-400", badge: "text-red-400 bg-red-400/10", key: "risks_high" as const },
  medium: { border: "border-amber-400", badge: "text-amber-400 bg-amber-400/10", key: "risks_medium" as const },
  low: { border: "border-slate-500", badge: "text-slate-400 bg-slate-400/10", key: "risks_low" as const },
} as const;

const statusConfig: Record<string, { key: "risks_open" | "risks_mitigating" | "risks_resolved"; color: string }> = {
  open: { key: "risks_open", color: "text-red-400" },
  mitigating: { key: "risks_mitigating", color: "text-amber-400" },
  resolved: { key: "risks_resolved", color: "text-emerald-400" },
};

const taskStatusConfig: Record<string, { color: string; icon: string }> = {
  todo: { color: "text-slate-500", icon: "circle" },
  in_progress: { color: "text-[#b4c5ff]", icon: "play_circle" },
  blocked: { color: "text-red-400", icon: "block" },
  done: { color: "text-emerald-400", icon: "check_circle" },
};

interface RisksContentProps {
  risks: RiskData[];
  linkedTasksMap: Record<string, TaskData[]>;
}

export function RisksContent({ risks, linkedTasksMap }: RisksContentProps) {
  const { t } = useLanguage();

  const sorted = [...risks].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  const counts = {
    high: risks.filter((r) => r.severity === "high").length,
    medium: risks.filter((r) => r.severity === "medium").length,
    low: risks.filter((r) => r.severity === "low").length,
  };

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-light tracking-tight text-white">
          {t("risks_title")}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {risks.length} {t("risks_tracked")} &middot; {counts.high} {t("risks_high")}, {counts.medium} {t("risks_medium")}, {counts.low} {t("risks_low")}
        </p>
      </div>

      {/* ── Summary pills ───────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#131b2d] px-4 py-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="tabular-nums font-medium text-white">{counts.high}</span>
          <span className="text-slate-500">{t("risks_high")}</span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#131b2d] px-4 py-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="tabular-nums font-medium text-white">{counts.medium}</span>
          <span className="text-slate-500">{t("risks_medium")}</span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#131b2d] px-4 py-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-slate-500" />
          <span className="tabular-nums font-medium text-white">{counts.low}</span>
          <span className="text-slate-500">{t("risks_low")}</span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#131b2d] px-4 py-2 text-sm">
          <span className="text-slate-500">{t("risks_mitigating")}:</span>
          <span className="tabular-nums font-medium text-amber-400">
            {risks.filter((r) => r.status === "mitigating").length}
          </span>
          <span className="text-slate-500">{t("risks_open")}:</span>
          <span className="tabular-nums font-medium text-red-400">
            {risks.filter((r) => r.status === "open").length}
          </span>
        </span>
      </div>

      {/* ── Risk Cards ──────────────────────────────────────── */}
      <div className="space-y-4">
        {sorted.map((risk) => {
          const config = severityConfig[risk.severity];
          const status = statusConfig[risk.status] || statusConfig.open;
          const linkedTasks = linkedTasksMap[risk.id] || [];

          return (
            <div key={risk.id} className={`rounded-lg bg-[#131b2d] border-l-2 ${config.border} overflow-hidden`}>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${config.badge}`}>
                    {t(config.key)}
                  </span>
                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${status.color}`}>
                    {t(status.key)}
                  </span>
                  {risk.workstream && (
                    <span className="text-[10px] text-slate-600">
                      {WORKSTREAM_KEYS[risk.workstream] ? t(WORKSTREAM_KEYS[risk.workstream]) : risk.workstream}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">{risk.owner.name}</span>
                    {risk.targetDate && (
                      <span className="text-[10px] text-slate-600 font-mono tabular-nums">{risk.targetDate}</span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-medium text-white mb-2">{risk.title}</h3>
                <p className="text-[12px] text-slate-400 leading-relaxed mb-4">{risk.description}</p>

                <div className="rounded-md bg-[#171f32] px-4 py-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-sm text-slate-500">shield</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{t("risks_mitigation")}</span>
                  </div>
                  <p className="text-[12px] text-slate-300 leading-relaxed">{risk.mitigationPlan}</p>
                </div>

                {linkedTasks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-sm text-slate-500">link</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                        {t("risks_linkedTasks")} ({linkedTasks.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {linkedTasks.map((task: TaskData) => {
                        const tCfg = taskStatusConfig[task.status] || taskStatusConfig.todo;
                        return (
                          <div key={task.id} className="flex items-center gap-3 rounded-md bg-[#171f32] px-3 py-2">
                            <span className={`material-symbols-outlined text-sm ${tCfg.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                              {tCfg.icon}
                            </span>
                            <span className="text-[11px] text-slate-400 shrink-0 w-14 truncate">
                              {task.assignee?.name.split(" ")[0] || "—"}
                            </span>
                            <span className="text-[10px] font-mono text-slate-600 shrink-0 w-8">{task.taskCode}</span>
                            <span className="text-[12px] text-slate-300 flex-1 truncate">{task.title}</span>
                            {task.dueDate && (
                              <span className="text-[10px] text-slate-600 font-mono tabular-nums shrink-0">{task.dueDate}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
