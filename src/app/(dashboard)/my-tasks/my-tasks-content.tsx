"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskData, WorkstreamData, UserOption } from "@/lib/data";
import type { CurrentUser } from "@/lib/supabase/get-current-user";
import { useLanguage } from "@/lib/i18n/context";
import { formatDueDate, isOverdue } from "@/lib/utils";
import { TaskModal } from "@/components/task-modal";

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// ─── Date helpers ─────────────────────────────────────────────
const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDate(dateStr: string): Date | null {
  // Handle ISO format "2026-04-07"
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  // Handle short format "Apr 7"
  const parts = dateStr.split(" ");
  if (parts.length !== 2) return null;
  const month = MONTHS[parts[0]];
  const day = parseInt(parts[1]);
  if (month === undefined || isNaN(day)) return null;
  return new Date(new Date().getFullYear(), month, day);
}


function isThisWeek(dateStr: string): boolean {
  const d = parseDate(dateStr);
  if (!d) return false;
  const now = new Date();
  const weekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return d >= now && d <= weekOut;
}

function relativeTime(dateStr: string, t: (k: Parameters<ReturnType<typeof useLanguage>["t"]>[0]) => string): string {
  const d = parseDate(dateStr);
  if (!d) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t("tasks_dueToday");
  if (diffDays === 1) return t("tasks_oneDayOverdue");
  if (diffDays > 1) return `${diffDays} ${t("tasks_daysOverdue")}`;
  if (diffDays === -1) return t("tasks_dueTomorrow");
  return `${t("tasks_dueIn")} ${Math.abs(diffDays)} ${t("tasks_days")}`;
}

// ─── Grouping ─────────────────────────────────────────────────
function groupTasks(tasks: TaskData[]) {
  const overdue: TaskData[] = [];
  const thisWeek: TaskData[] = [];
  const later: TaskData[] = [];
  const completed: TaskData[] = [];

  for (const task of tasks) {
    if (task.status === "done") {
      completed.push(task);
    } else if (task.dueDate && isOverdue(task.dueDate)) {
      overdue.push(task);
    } else if (task.dueDate && isThisWeek(task.dueDate)) {
      thisWeek.push(task);
    } else {
      later.push(task);
    }
  }

  const sortByPriority = (a: TaskData, b: TaskData) =>
    PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];

  overdue.sort(sortByPriority);
  thisWeek.sort(sortByPriority);
  later.sort(sortByPriority);

  return { overdue, thisWeek, later, completed };
}

// ─── Sub-components ───────────────────────────────────────────

function TaskCode({ code }: { code: string }) {
  return (
    <code className="font-mono text-xs text-slate-500 bg-[#2d3448] px-2 py-1 rounded">
      {code}
    </code>
  );
}


function PriorityBadge({ priority }: { priority: string }) {
  const { t } = useLanguage();
  if (priority !== "critical" && priority !== "high") return null;
  return (
    <span className="inline-flex items-center rounded-full bg-[#dfc299]/15 px-2.5 py-0.5 text-[10px] text-[#dfc299] font-semibold uppercase tracking-wider">
      {t("tasks_priority")}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const { t } = useLanguage();
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-blue-400">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        {t("status_inProgress")}
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        {t("status_blocked")}
      </span>
    );
  }
  if (status === "review") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        {t("status_review")}
      </span>
    );
  }
  return null;
}

function AssigneeAvatar({ assignee }: { assignee: TaskData["assignee"] }) {
  if (!assignee) return null;
  return (
    <div className="h-7 w-7 rounded-full bg-[#2d3448] flex items-center justify-center text-[10px] font-semibold text-slate-400 shrink-0">
      {assignee.initials}
    </div>
  );
}

// ─── Card variants ────────────────────────────────────────────

function OverdueCard({ task, onEdit }: { task: TaskData; onEdit: (t: TaskData) => void }) {
  const { t } = useLanguage();
  return (
    <div
      onClick={() => onEdit(task)}
      className="relative rounded-lg bg-[#131b2d] p-4 pl-6 flex items-center gap-4 cursor-pointer hover:bg-[#171f32] transition-colors"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-red-500" />
      <TaskCode code={task.taskCode} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-lg text-blue-100 truncate">{task.title}</p>

        </div>
        <div className="flex items-center gap-3 mt-1">
          {task.dueDate && (
            <span className="text-[11px] text-red-400 tabular-nums">
              {relativeTime(task.dueDate, t)}
            </span>
          )}
          <StatusDot status={task.status} />
        </div>
      </div>
      <AssigneeAvatar assignee={task.assignee} />
    </div>
  );
}

function WeekCard({ task, onEdit }: { task: TaskData; onEdit: (t: TaskData) => void }) {
  const { t } = useLanguage();
  return (
    <div
      onClick={() => onEdit(task)}
      className="relative rounded-lg bg-[#131b2d] p-4 pl-6 flex items-center gap-4 cursor-pointer hover:bg-[#171f32] transition-colors"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-blue-500" />
      <TaskCode code={task.taskCode} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-lg text-blue-100 truncate">{task.title}</p>

          <PriorityBadge priority={task.priority} />
        </div>
        <div className="flex items-center gap-3 mt-1">
          {task.dueDate && (
            <span className="text-[11px] text-slate-500 tabular-nums">
              {t("tasks_due")} {formatDueDate(task.dueDate)}
            </span>
          )}
          <StatusDot status={task.status} />
        </div>
      </div>
      <AssigneeAvatar assignee={task.assignee} />
    </div>
  );
}

function LaterCard({ task, onEdit }: { task: TaskData; onEdit: (t: TaskData) => void }) {
  const { t } = useLanguage();
  return (
    <div
      onClick={() => onEdit(task)}
      className="relative rounded-lg bg-[#131b2d]/60 p-4 pl-6 flex items-center gap-4 cursor-pointer hover:bg-[#171f32]/60 transition-colors"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-slate-600" />
      <TaskCode code={task.taskCode} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-slate-300 truncate">{task.title}</p>

        </div>
        <div className="flex items-center gap-3 mt-1">
          {task.dueDate && (
            <span className="text-[11px] text-slate-500 tabular-nums">
              {t("tasks_due")} {formatDueDate(task.dueDate)}
            </span>
          )}
          <StatusDot status={task.status} />
        </div>
      </div>
      <AssigneeAvatar assignee={task.assignee} />
    </div>
  );
}

function CompletedCard({ task }: { task: TaskData }) {
  return (
    <div className="relative rounded-lg bg-[#131b2d]/40 p-4 pl-6 flex items-center gap-4">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-emerald-600/50" />
      <TaskCode code={task.taskCode} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 line-through truncate">{task.title}</p>
      </div>
      <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
    </div>
  );
}

// ─── Collapsible section ──────────────────────────────────────

function CollapsibleSection({
  icon,
  title,
  titleColor,
  count,
  badgeText,
  badgeColor,
  defaultOpen = true,
  opacity,
  children,
}: {
  icon: string;
  title: string;
  titleColor: string;
  count: number;
  badgeText?: string;
  badgeColor?: string;
  defaultOpen?: boolean;
  opacity?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (count === 0) return null;

  return (
    <section className={opacity}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 mb-4 group cursor-pointer"
      >
        <span className={`material-symbols-outlined text-xl ${titleColor}`}>{icon}</span>
        <h2 className={`font-serif text-2xl ${titleColor}`}>{title}</h2>
        {badgeText && (
          <span className={`ml-2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeColor}`}>
            {badgeText}
          </span>
        )}
        <span className="ml-auto material-symbols-outlined text-slate-600 text-lg transition-transform group-hover:text-slate-400">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </section>
  );
}

// ─── Main content ─────────────────────────────────────────────

interface MyTasksContentProps {
  tasks: TaskData[];
  currentUser: CurrentUser | null;
  workstreams: WorkstreamData[];
  userOptions: UserOption[];
}

export function MyTasksContent({ tasks, currentUser, workstreams, userOptions }: MyTasksContentProps) {
  const { overdue, thisWeek, later, completed } = groupTasks(tasks);
  const activeTasks = tasks.filter((t) => t.status !== "done");
  const { t } = useLanguage();
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);

  function openCreate() { setModalOpen(true); }
  function openEdit(task: TaskData) { router.push(`/tasks/${task.id}`); }

  return (
    <div className="space-y-10">
      {/* ── Header ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#dfc299]">
            {t("tasks_operatorQueue")}
          </span>
          {currentUser && (currentUser.isAdmin || currentUser.isContributor) && (
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-lg bg-[#1a2744] hover:bg-[#1f3060] border border-[#b4c5ff]/20 text-[#b4c5ff] text-xs font-medium px-4 py-2 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {t("tasks_newTask")}
            </button>
          )}
        </div>
        <div className="flex items-baseline gap-4">
          <h1 className="font-serif text-5xl font-light tracking-tight text-white leading-[1.1]">
            {t("tasks_title")}
          </h1>
          <span className="font-serif text-3xl font-light text-slate-600 tabular-nums">
            {activeTasks.length}
          </span>
        </div>
        <p className="text-sm text-slate-400 max-w-md">
          {t("tasks_queueDesc")}
        </p>
      </section>

      <CollapsibleSection
        icon="error"
        title={t("tasks_overduePriorities")}
        titleColor="text-red-400"
        count={overdue.length}
        badgeText={`${overdue.length} ${t("tasks_actionsRequired")}`}
        badgeColor="bg-red-500/20 text-red-400"
      >
        {overdue.map((task) => <OverdueCard key={task.id} task={task} onEdit={openEdit} />)}
      </CollapsibleSection>

      <CollapsibleSection
        icon="calendar_month"
        title={t("tasks_scheduledThisWeek")}
        titleColor="text-blue-200"
        count={thisWeek.length}
        badgeText={`${thisWeek.length}`}
        badgeColor="bg-[#b4c5ff]/15 text-[#b4c5ff]"
      >
        {thisWeek.map((task) => <WeekCard key={task.id} task={task} onEdit={openEdit} />)}
      </CollapsibleSection>

      <CollapsibleSection
        icon="schedule"
        title={t("tasks_deferredFuture")}
        titleColor="text-slate-400"
        count={later.length}
        badgeText={`${later.length}`}
        badgeColor="bg-slate-700 text-slate-400"
        defaultOpen={false}
        opacity="opacity-60 hover:opacity-100 transition-opacity"
      >
        {later.map((task) => <LaterCard key={task.id} task={task} onEdit={openEdit} />)}
      </CollapsibleSection>

      <CollapsibleSection
        icon="check_circle"
        title={t("tasks_directiveArchives")}
        titleColor="text-slate-500"
        count={completed.length}
        badgeText={`${completed.length}`}
        badgeColor="bg-emerald-500/10 text-emerald-500"
        defaultOpen={false}
        opacity="opacity-40 hover:opacity-80 transition-opacity"
      >
        {completed.map((task) => <CompletedCard key={task.id} task={task} />)}
      </CollapsibleSection>

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">task_alt</span>
          <p className="font-serif text-xl text-slate-400">{t("tasks_noDirectives")}</p>
          <p className="text-sm text-slate-600 mt-1">{t("tasks_tasksWillAppear")}</p>
        </div>
      )}

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
