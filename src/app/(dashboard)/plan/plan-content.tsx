"use client";

import { useState } from "react";
import type {
  TaskData,
  WorkstreamData,
  PhaseData,
  DecisionGate,
  MilestoneData,
} from "@/lib/data";

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
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  blocked: { label: "Blocked", color: "text-red-400", icon: "block" },
  in_progress: { label: "In Progress", color: "text-[#b4c5ff]", icon: "play_circle" },
  todo: { label: "To Do", color: "text-slate-500", icon: "circle" },
  done: { label: "Done", color: "text-emerald-400", icon: "check_circle" },
};

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const PRIORITY_CONFIG: Record<string, { label: string; text: string; border: string; opacity: string }> = {
  critical: { label: "Critical", text: "text-red-400", border: "border-red-400", opacity: "" },
  high: { label: "High", text: "text-amber-400", border: "border-amber-400", opacity: "" },
  medium: { label: "Medium", text: "text-slate-400", border: "border-slate-600", opacity: "" },
  low: { label: "Low", text: "text-slate-500", border: "border-slate-700", opacity: "opacity-70" },
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
}: PlanContentProps) {
  const [activePhaseNum, setActivePhaseNum] = useState<1 | 2 | 3>(1);
  const [activeWorkstream, setActiveWorkstream] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  // Filter by phase + workstream
  let filtered = tasks.filter((t) => t.phase === activePhaseNum);
  if (activeWorkstream) {
    filtered = filtered.filter((t) => t.workstream === activeWorkstream);
  }

  // Separate done vs active
  const activeTasks = filtered.filter((t) => t.status !== "done");
  const doneTotalInPhase = filtered.filter((t) => t.status === "done");

  // Group by priority, sort within each group by due date
  const priorityGroups = (["critical", "high", "medium", "low"] as const).map((priority) => {
    const groupTasks = activeTasks
      .filter((t) => t.priority === priority)
      .sort((a, b) => {
        // Sort by due date, then by status (blocked first)
        const statusOrder: Record<string, number> = { blocked: 0, in_progress: 1, todo: 2 };
        const sa = statusOrder[a.status] ?? 9;
        const sb = statusOrder[b.status] ?? 9;
        if (sa !== sb) return sa - sb;
        return 0;
      });
    return { priority, tasks: groupTasks };
  }).filter((g) => g.tasks.length > 0);

  // Status counts for current filter
  const statusCounts = filtered.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activePhase = phases.find((p) => p.phaseNumber === activePhaseNum);

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══════════════════════════════════════════════ */}
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-light tracking-tight text-slate-100">
          100-Day Plan
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {totalTasks} tasks across 6 workstreams &middot; {doneTasks} completed ({directivesPct}%)
        </p>
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
                  Phase {phase.phaseNumber}
                </span>
                <span className={`text-xs mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-600"}`}>
                  {phase.name}
                </span>
                <span className="text-[10px] text-slate-600 mt-0.5 tabular-nums">
                  {phaseDone}/{phaseTasks.length} done
                </span>
              </button>
            );
          })}
        </div>

        {/* Phase info bar */}
        {activePhase && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/30">
            <span className="text-[11px] text-slate-400">
              {activePhase.subtitle}
            </span>
            <span className="text-[11px] text-slate-500 tabular-nums">
              Days {activePhase.startDay}–{activePhase.endDay} &middot; {activePhase.startDate} – {activePhase.endDate}
            </span>
          </div>
        )}
      </div>

      {/* ═══ Workstream Filters ═══════════════════════════════════ */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveWorkstream(null)}
          className={`px-4 py-1.5 rounded-full text-[11px] uppercase font-semibold transition-all ${
            activeWorkstream === null
              ? "bg-[#1a2744] text-[#b4c5ff] border border-[#b4c5ff]/30"
              : "bg-[#131b2d] text-slate-400 hover:text-slate-200 border border-slate-700/40"
          }`}
        >
          All
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
              {ws.name}
              <span className="text-slate-600">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ Status Summary + View Toggle ═════════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-3">
        {(["blocked", "in_progress", "todo", "done"] as const).map((status) => {
          const count = statusCounts[status] || 0;
          const cfg = STATUS_CONFIG[status];
          return (
            <span key={status} className="inline-flex items-center gap-2 rounded-full bg-[#131b2d] px-3 py-1.5 text-xs">
              <span className={`material-symbols-outlined text-sm ${cfg.color}`}>{cfg.icon}</span>
              <span className="tabular-nums font-medium text-white">{count}</span>
              <span className="text-slate-500">{cfg.label}</span>
            </span>
          );
        })}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-[#131b2d] rounded-lg p-1">
          <button
            onClick={() => setViewMode("board")}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(["blocked", "in_progress", "todo", "done"] as const).map((status) => {
            const cfg = STATUS_CONFIG[status];
            const columnTasks = filtered
              .filter((t) => t.status === status)
              .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));

            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-sm ${cfg.color}`}>{cfg.icon}</span>
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-[10px] tabular-nums text-slate-600">{columnTasks.length}</span>
                </div>

                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <BoardCard key={task.id} task={task} />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="rounded-lg bg-[#131b2d] p-4 text-center text-[11px] text-slate-600">
                      No tasks
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
        {priorityGroups.map((group) => {
          const cfg = PRIORITY_CONFIG[group.priority];
          return (
            <div key={group.priority}>
              {/* Priority group header */}
              <div className={`flex items-center gap-3 mb-3 border-l-2 ${cfg.border} pl-3`}>
                <span className={`text-[10px] uppercase tracking-widest font-semibold ${cfg.text}`}>
                  {cfg.label}
                </span>
                <span className="text-[10px] text-slate-600 tabular-nums">{group.tasks.length}</span>
              </div>

              {/* Tasks */}
              <div className={`space-y-1.5 ${cfg.opacity}`}>
                {group.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            </div>
          );
        })}

        {priorityGroups.length === 0 && doneTotalInPhase.length === 0 && (
          <div className="rounded-lg bg-[#131b2d] p-8 text-center text-sm text-slate-500">
            No tasks in this phase{activeWorkstream ? ` for ${activeWorkstream}` : ""}.
          </div>
        )}

        {/* Completed section (collapsed by default) */}
        {doneTotalInPhase.length > 0 && (
          <div className="pt-4">
            <button
              onClick={() => setShowDone(!showDone)}
              className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                {showDone ? "expand_less" : "expand_more"}
              </span>
              {doneTotalInPhase.length} completed
            </button>
            {showDone && (
              <div className="space-y-1.5 mt-2 opacity-50">
                {doneTotalInPhase.map((task) => (
                  <TaskRow key={task.id} task={task} />
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
              Decision Gates
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
                        Day {gate.dayNumber} &middot; {gate.targetDate}
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
    </div>
  );
}

// ─── Task Row ───────────────────────────────────────────────────
function TaskRow({ task }: { task: TaskData }) {
  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
  const isDone = task.status === "done";

  return (
    <div className="flex items-center gap-3 rounded-lg bg-[#131b2d] px-4 py-3 hover:bg-[#171f32] transition-colors">
      {/* Status icon */}
      <span className={`material-symbols-outlined text-base shrink-0 ${cfg.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {cfg.icon}
      </span>

      {/* Assignee (left side — who owns this?) */}
      <span className={`text-[11px] shrink-0 w-16 truncate ${isDone ? "text-slate-600" : "text-slate-400"}`}>
        {task.assignee?.name.split(" ")[0] || "—"}
      </span>

      {/* Due date (left side — when is it due?) */}
      <span className={`text-[10px] font-mono tabular-nums shrink-0 w-12 ${isDone ? "text-slate-600" : "text-slate-500"}`}>
        {task.dueDate || "—"}
      </span>

      {/* Task code */}
      <span className="text-[10px] font-mono text-slate-600 shrink-0 w-8">{task.taskCode}</span>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm truncate block ${isDone ? "line-through text-slate-600" : "text-slate-200"}`}>
          {task.title}
        </span>
      </div>

      {/* Status badge (for blocked/in_progress) */}
      {(task.status === "blocked" || task.status === "in_progress") && (
        <span className={`text-[9px] uppercase tracking-wider font-semibold shrink-0 ${cfg.color}`}>
          {cfg.label}
        </span>
      )}

      {/* Cross-office badge */}
      {task.isCrossOffice && (
        <span className="text-[9px] uppercase tracking-wider text-[#dfc299]/60 shrink-0">
          Cross-Office
        </span>
      )}
    </div>
  );
}

// ─── Board Card (Kanban) ────────────────────────────────────────
function BoardCard({ task }: { task: TaskData }) {
  const isCritical = task.priority === "critical";
  const isHigh = task.priority === "high";
  const isDone = task.status === "done";

  return (
    <div className={`rounded-lg bg-[#131b2d] p-3 border border-slate-700/30 ${
      isCritical ? "border-l-2 border-l-red-400" :
      isHigh ? "border-l-2 border-l-amber-400" : ""
    }`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-mono text-slate-600">{task.taskCode}</span>
        {isCritical && (
          <span className="text-[9px] uppercase tracking-wider text-red-400 font-semibold">Critical</span>
        )}
        {task.isCrossOffice && (
          <span className="text-[9px] uppercase tracking-wider text-[#dfc299]/60">Cross-Office</span>
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
          <span className="text-[10px] font-mono text-slate-600 tabular-nums">{task.dueDate}</span>
        )}
      </div>
    </div>
  );
}
