"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  TaskData,
  WorkstreamData,
  PhaseData,
  DecisionGate,
  MilestoneData,
  UserOption,
} from "@/lib/data";
import type { CurrentUser } from "@/lib/supabase/get-current-user";
import { useLanguage } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/translations";
import { TaskModal } from "@/components/task-modal";
import { formatDueDate } from "@/lib/utils";

const WORKSTREAM_KEYS: Record<string, TranslationKey> = {
  "Finance": "ws_Finance",
  "Operations": "ws_Operations",
  "Sales": "ws_Sales",
  "Brand & Marketing": "ws_BrandMarketing",
  "Technology & AI": "ws_TechnologyAI",
  "Organization & HR": "ws_OrgHR",
};

// ─── Props ───────────────────────────────────────────────────────
interface PlanContentProps {
  tasks: TaskData[];
  workstreams: WorkstreamData[];
  phases: PhaseData[];
  gates: DecisionGate[];
  milestones: MilestoneData[];
  currentDay: number;
  totalTasks: number;
  doneTasks: number;
  directivesPct: number;
  currentUser: CurrentUser | null;
  userOptions: UserOption[];
}

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string; key: "status_blocked" | "status_inProgress" | "status_todo" | "status_done" }> = {
  blocked:     { color: "text-red-400",      icon: "block",        label: "Blocked",     key: "status_blocked" },
  in_progress: { color: "text-[#b4c5ff]",   icon: "play_circle",  label: "In Progress", key: "status_inProgress" },
  todo:        { color: "text-slate-500",    icon: "circle",       label: "To Do",       key: "status_todo" },
  done:        { color: "text-emerald-400",  icon: "check_circle", label: "Done",        key: "status_done" },
  review:      { color: "text-amber-400",    icon: "rate_review",  label: "Review",      key: "status_todo" },
};

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
};

const PRIORITY_CONFIG: Record<string, { key: "priority_critical" | "priority_high" | "priority_medium" | "priority_low"; text: string; border: string; opacity: string }> = {
  critical: { key: "priority_critical", text: "text-red-400",    border: "border-red-400",    opacity: "" },
  high:     { key: "priority_high",     text: "text-amber-400",  border: "border-amber-400",  opacity: "" },
  medium:   { key: "priority_medium",   text: "text-slate-400",  border: "border-slate-600",  opacity: "" },
  low:      { key: "priority_low",      text: "text-slate-500",  border: "border-slate-700",  opacity: "opacity-70" },
};

export function PlanContent({
  tasks,
  workstreams,
  phases,
  gates,
  currentDay,
  totalTasks,
  doneTasks,
  directivesPct,
  currentUser,
  userOptions,
}: PlanContentProps) {
  const [activePhaseNum, setActivePhaseNum] = useState<1 | 2 | 3>(1);
  const [activeWorkstream, setActiveWorkstream] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null);

  const router = useRouter();

  // Modal state (create only)
  const [modalOpen, setModalOpen] = useState(false);

  function openCreate() {
    setModalOpen(true);
  }

  function openEdit(task: TaskData) {
    router.push(`/tasks/${task.id}`);
  }

  // Filter by phase + workstream
  let filtered = tasks.filter((t) => t.phase === activePhaseNum);
  if (activeWorkstream) {
    filtered = filtered.filter((t) => t.workstream === activeWorkstream);
  }

  const activeTasks = filtered.filter((t) => t.status !== "done");
  const doneTotalInPhase = filtered.filter((t) => t.status === "done");

  const listTasks = activeStatusFilter
    ? activeTasks.filter((t) => t.status === activeStatusFilter)
    : activeTasks;

  const priorityGroups = (["critical", "high", "medium", "low"] as const).map((priority) => {
    const groupTasks = listTasks
      .filter((t) => t.priority === priority)
      .sort((a, b) => {
        const statusOrder: Record<string, number> = { blocked: 0, in_progress: 1, review: 2, todo: 3 };
        const sa = statusOrder[a.status] ?? 9;
        const sb = statusOrder[b.status] ?? 9;
        return sa - sb;
      });
    return { priority, tasks: groupTasks };
  }).filter((g) => g.tasks.length > 0);

  const activePhase = phases.find((p) => p.phaseNumber === activePhaseNum);
  const { t } = useLanguage();
  const canWrite = currentUser?.isAdmin || currentUser?.isContributor;

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══════════════════════════════════════════════ */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl lg:text-4xl font-light tracking-tight text-slate-100">
            {t("plan_title")}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {totalTasks} {t("plan_subtitle_tasks")} &middot; {doneTasks} {t("plan_subtitle_completed")} ({directivesPct}%)
          </p>
        </div>
        {canWrite && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-[#1a2744] hover:bg-[#1f3060] border border-[#b4c5ff]/20 text-[#b4c5ff] text-xs font-medium px-4 py-2 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Task
          </button>
        )}
      </div>

      {/* ═══ Phase Tabs ═══════════════════════════════════════════ */}
      <div className="rounded-lg bg-[#131b2d] border border-slate-700/40 overflow-hidden">
        <div className="flex">
          {phases.map((phase) => {
            const isSelected = phase.phaseNumber === activePhaseNum;
            const phaseTasks = tasks.filter((t) => t.phase === phase.phaseNumber);
            const phaseDone = phaseTasks.filter((t) => t.status === "done").length;
            return (
              <button
                key={phase.id}
                onClick={() => setActivePhaseNum(phase.phaseNumber as 1 | 2 | 3)}
                className={`flex-1 flex flex-col items-center py-3 px-2 transition-colors ${
                  isSelected
                    ? "bg-[#1a2744] border-b-2 border-[#b4c5ff]"
                    : "hover:bg-[#171f32] border-b-2 border-transparent"
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                  isSelected ? "text-[#b4c5ff]" : "text-slate-500"
                }`}>
                  {t("plan_phase")} {phase.phaseNumber}
                </span>
                <span className={`text-xs mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-600"}`}>
                  {phase.name}
                </span>
                <span className="text-[10px] text-slate-600 mt-0.5 tabular-nums">
                  {phaseDone}/{phaseTasks.length} {t("plan_done")}
                </span>
              </button>
            );
          })}
        </div>

        {activePhase && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/30">
            <span className="text-[11px] text-slate-400">{activePhase.subtitle}</span>
            <span className="text-[11px] text-slate-500 tabular-nums">
              {t("plan_days")} {activePhase.startDay}–{activePhase.endDay} &middot; {activePhase.startDate} – {activePhase.endDate}
            </span>
          </div>
        )}
      </div>

      {/* ═══ Workstream Filters + View Toggle ════════════════════ */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveWorkstream(null)}
          className={`px-4 py-1.5 rounded-full text-[11px] uppercase font-semibold transition-all ${
            activeWorkstream === null
              ? "bg-[#1a2744] text-[#b4c5ff] border border-[#b4c5ff]/30"
              : "bg-[#131b2d] text-slate-400 hover:text-slate-200 border border-slate-700/40"
          }`}
        >
          {t("plan_all")}
        </button>
        {workstreams.map((ws) => {
          const count = tasks.filter((t) => t.phase === activePhaseNum && t.workstream === ws.name).length;
          if (count === 0) return null;
          return (
            <button
              key={ws.id}
              onClick={() => setActiveWorkstream(activeWorkstream === ws.name ? null : ws.name)}
              className={`px-4 py-1.5 rounded-full text-[11px] uppercase font-semibold transition-all flex items-center gap-2 ${
                activeWorkstream === ws.name
                  ? "bg-[#1a2744] text-[#b4c5ff] border border-[#b4c5ff]/30"
                  : "bg-[#131b2d] text-slate-400 hover:text-slate-200 border border-slate-700/40"
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ws.color }} />
              {WORKSTREAM_KEYS[ws.name] ? t(WORKSTREAM_KEYS[ws.name]) : ws.name}
              <span className="text-slate-600">{count}</span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1 bg-[#131b2d] rounded-lg p-1">
          <button
            onClick={() => { setViewMode("board"); setActiveStatusFilter(null); }}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "board" ? "bg-[#1a2744] text-[#b4c5ff]" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className="material-symbols-outlined text-lg">view_column</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "list" ? "bg-[#1a2744] text-[#b4c5ff]" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className="material-symbols-outlined text-lg">view_list</span>
          </button>
        </div>
      </div>

      {/* ═══ Board View (Kanban) ═══════════════════════════════════ */}
      {viewMode === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {(["blocked", "in_progress", "review", "todo", "done"] as const).map((status) => {
            const cfg = STATUS_CONFIG[status];
            const columnTasks = filtered
              .filter((t) => t.status === status)
              .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));

            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`material-symbols-outlined text-sm ${cfg.color}`}>{cfg.icon}</span>
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">
                    {t(cfg.key)}
                  </span>
                  <span className="text-[10px] font-semibold tabular-nums text-slate-400">{columnTasks.length}</span>
                </div>

                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <BoardCard key={task.id} task={task} onEdit={openEdit} />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="rounded-lg bg-[#131b2d] p-4 text-center text-[11px] text-slate-600">
                      {t("plan_noTasks")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ List View (Priority-Grouped) ══════════════════════════ */}
      {viewMode === "list" && (
        <div className="space-y-6">
          {/* Status filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {(["blocked", "in_progress", "review", "todo"] as const).map((status) => {
              const cfg = STATUS_CONFIG[status];
              const count = activeTasks.filter((t) => t.status === status).length;
              if (count === 0) return null;
              const isActive = activeStatusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setActiveStatusFilter(isActive ? null : status)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all border ${
                    isActive
                      ? "bg-[#1a2744] border-[#b4c5ff]/30 text-[#b4c5ff]"
                      : "bg-[#131b2d] border-slate-700/40 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className={`material-symbols-outlined text-sm ${isActive ? "text-[#b4c5ff]" : cfg.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {cfg.icon}
                  </span>
                  {t(cfg.key)}
                  <span className="text-slate-500 font-normal">{count}</span>
                </button>
              );
            })}
          </div>

          {priorityGroups.map((group) => {
            const cfg = PRIORITY_CONFIG[group.priority];
            return (
              <div key={group.priority}>
                <div className={`flex items-center gap-3 mb-3 border-l-2 ${cfg.border} pl-3`}>
                  <span className={`text-[10px] uppercase tracking-widest font-semibold ${cfg.text}`}>
                    {t(cfg.key)}
                  </span>
                  <span className="text-[10px] text-slate-600 tabular-nums">{group.tasks.length}</span>
                </div>

                <div className={`space-y-1.5 ${cfg.opacity}`}>
                  {group.tasks.map((task) => (
                    <TaskRow key={task.id} task={task} onEdit={openEdit} />
                  ))}
                </div>
              </div>
            );
          })}

          {priorityGroups.length === 0 && doneTotalInPhase.length === 0 && (
            <div className="rounded-lg bg-[#131b2d] p-8 text-center text-sm text-slate-500">
              {t("plan_noTasks")}{activeWorkstream ? ` ${t("plan_noTasksFor")} ${activeWorkstream}` : ""}.
            </div>
          )}

          {doneTotalInPhase.length > 0 && (
            <div className="pt-4">
              <button
                onClick={() => setShowDone(!showDone)}
                className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  {showDone ? "expand_less" : "expand_more"}
                </span>
                {doneTotalInPhase.length} {t("plan_completedCount")}
              </button>
              {showDone && (
                <div className="space-y-1.5 mt-2 opacity-50">
                  {doneTotalInPhase.map((task) => (
                    <TaskRow key={task.id} task={task} onEdit={openEdit} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ Decision Gates ═══════════════════════════════════════ */}
      {(() => {
        const phaseGates = gates.filter((g) => g.phaseId === `phase-${activePhaseNum}`);
        if (phaseGates.length === 0) return null;
        return (
          <div>
            <h2 className="text-[10px] tracking-widest uppercase text-slate-500 font-semibold mb-3">
              {t("plan_decisionGates")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {phaseGates.map((gate) => {
                const isPassed = gate.status === "passed";
                return (
                  <div
                    key={gate.id}
                    className={`rounded-lg border p-4 ${
                      isPassed
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-[#dfc299]/20 bg-[#131b2d]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`material-symbols-outlined text-sm ${
                        isPassed ? "text-emerald-400" : "text-[#dfc299]"
                      }`}>
                        {isPassed ? "check_circle" : "door_front"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                        {t("plan_day")} {gate.dayNumber} &middot; {gate.targetDate}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200">{gate.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{gate.owner}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ═══ Task Modal ═══════════════════════════════════════════ */}
      {currentUser && (
        <TaskModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          task={null}
          workstreams={workstreams}
          userOptions={userOptions}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

// ─── Task Row ───────────────────────────────────────────────────
function TaskRow({
  task,
  onEdit,
}: {
  task: TaskData;
  onEdit: (t: TaskData) => void;
}) {
  const isDone = task.status === "done";

  return (
    <div
      onClick={() => onEdit(task)}
      className="flex items-center gap-3 rounded-lg bg-[#131b2d] px-4 py-3 hover:bg-[#171f32] transition-colors cursor-pointer"
    >
      <span className={`material-symbols-outlined text-base shrink-0 ${STATUS_CONFIG[task.status]?.color ?? "text-slate-500"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {STATUS_CONFIG[task.status]?.icon ?? "circle"}
      </span>
      <span className={`text-[11px] shrink-0 w-16 truncate ${isDone ? "text-slate-600" : "text-slate-400"}`}>
        {task.assignee?.name.split(" ")[0] || "—"}
      </span>
      <span className={`text-[10px] font-mono tabular-nums shrink-0 w-12 ${isDone ? "text-slate-600" : "text-slate-500"}`}>
        {formatDueDate(task.dueDate) || "—"}
      </span>
      <span className="text-[10px] font-mono text-slate-600 shrink-0 w-8">{task.taskCode}</span>
      <div className="flex-1 min-w-0">
        <span className={`text-sm truncate block ${isDone ? "line-through text-slate-600" : "text-slate-200"}`}>
          {task.title}
        </span>
      </div>
      {(task.status === "blocked" || task.status === "in_progress") && (
        <span className={`text-[9px] uppercase tracking-wider font-semibold shrink-0 ${STATUS_CONFIG[task.status]?.color}`}>
          {STATUS_CONFIG[task.status]?.label}
        </span>
      )}
    </div>
  );
}

// ─── Board Card (Kanban) ────────────────────────────────────────
function BoardCard({
  task,
  onEdit,
}: {
  task: TaskData;
  onEdit: (t: TaskData) => void;
}) {
  const isCritical = task.priority === "critical";
  const isHigh = task.priority === "high";
  const isDone = task.status === "done";
  const { t } = useLanguage();

  return (
    <div
      onClick={() => onEdit(task)}
      className={`rounded-lg bg-[#131b2d] p-3 border border-slate-700/30 cursor-pointer hover:bg-[#171f32] transition-colors ${
        isCritical ? "border-l-2 border-l-red-400" :
        isHigh ? "border-l-2 border-l-amber-400" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`material-symbols-outlined text-base shrink-0 ${STATUS_CONFIG[task.status]?.color ?? "text-slate-500"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {STATUS_CONFIG[task.status]?.icon ?? "circle"}
        </span>
        <span className="text-[10px] font-mono text-slate-600">{task.taskCode}</span>
        {isCritical && (
          <span className="text-[9px] uppercase tracking-wider text-red-400 font-semibold">{t("priority_critical")}</span>
        )}
      </div>
      <p className={`text-[12px] leading-snug mb-2 ${isDone ? "line-through text-slate-600" : "text-slate-200"}`}>
        {task.title}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500 truncate max-w-[100px]">
          {task.assignee?.name.split(" ")[0] || "—"}
        </span>
        {task.dueDate && (
          <span className="text-[10px] font-mono text-slate-600 tabular-nums">{formatDueDate(task.dueDate)}</span>
        )}
      </div>
    </div>
  );
}
