"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TaskData, WorkstreamData, UserOption, TaskMeeting, TaskActivity, TaskComment, TaskActionItem } from "@/lib/data";
import type { CurrentUser } from "@/lib/supabase/get-current-user";
import { updateTask, deleteTask } from "@/lib/actions/tasks";
import { addTaskComment } from "@/lib/actions/comments";
import { useLanguage } from "@/lib/i18n/context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

interface TaskDetailContentProps {
  task: TaskData;
  workstreams: WorkstreamData[];
  userOptions: UserOption[];
  currentUser: CurrentUser | null;
  meetings: TaskMeeting[];
  taskActivities: TaskActivity[];
  taskComments: TaskComment[];
  taskActionItems: TaskActionItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string, t: (k: Parameters<ReturnType<typeof useLanguage>["t"]>[0]) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t("taskDetail_timeJustNow");
  if (m < 60) return `${m}${t("taskDetail_timeMinutes")}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${t("taskDetail_timeHours")}`;
  return `${Math.floor(h / 24)}${t("taskDetail_timeDays")}`;
}

function Avatar({ initials, size = "sm" }: { initials: string; size?: "sm" | "xs" }) {
  const cls = size === "xs"
    ? "h-5 w-5 text-[9px]"
    : "h-7 w-7 text-[10px]";
  return (
    <div className={`${cls} rounded-full bg-[#2d3448] flex items-center justify-center font-semibold text-slate-400 shrink-0`}>
      {initials}
    </div>
  );
}

const ACTION_ITEM_COLOR: Record<string, string> = {
  open:        "text-slate-400",
  in_progress: "text-blue-400",
  done:        "text-emerald-400",
  cancelled:   "text-slate-600",
};

const MEETING_TYPE_BADGE: Record<string, string> = {
  board:      "bg-purple-500/15 text-purple-400",
  leadership: "bg-blue-500/15 text-blue-400",
  department: "bg-amber-500/15 text-amber-400",
  strategy:   "bg-emerald-500/15 text-emerald-400",
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, count, children }: {
  title: string;
  icon: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-700/40 pb-2">
        <span className="material-symbols-outlined text-base text-slate-500">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</h3>
        {count !== undefined && (
          <span className="ml-auto text-[10px] text-slate-600">{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Meetings panel ───────────────────────────────────────────────────────────

function MeetingsPanel({ meetings }: { meetings: TaskMeeting[] }) {
  const { t } = useLanguage();

  const meetingTypeLabel: Record<string, string> = {
    board:      t("taskDetail_meetingBoard"),
    leadership: t("taskDetail_meetingLeadership"),
    department: t("taskDetail_meetingDepartment"),
    strategy:   t("taskDetail_meetingStrategy"),
  };

  return (
    <div className="space-y-3">
      {meetings.map((m) => (
        <div key={m.id} className="rounded-lg bg-[#131b2d] p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm text-slate-200 font-medium">{m.title}</p>
              <p className="text-[11px] text-slate-500">{m.meetingDate}</p>
            </div>
            {m.meetingType && (
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${MEETING_TYPE_BADGE[m.meetingType] ?? "bg-slate-700 text-slate-400"}`}>
                {meetingTypeLabel[m.meetingType] ?? m.meetingType}
              </span>
            )}
          </div>

          {m.attendees.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {m.attendees.map((a) => (
                <div key={a.name} className="flex items-center gap-1 rounded-full bg-[#1a2236] px-2 py-0.5">
                  <Avatar initials={a.initials} size="xs" />
                  <span className="text-[11px] text-slate-400">{a.name}</span>
                </div>
              ))}
            </div>
          )}

          {m.decisions.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t("taskDetail_decisions")}</p>
              <ul className="space-y-1">
                {m.decisions.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="material-symbols-outlined text-sm text-emerald-500 shrink-0 mt-0.5">check_circle</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {m.body && (
            <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-700/40 pt-3">{m.body}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Action items panel ───────────────────────────────────────────────────────

function ActionItemsPanel({ items }: { items: TaskActionItem[] }) {
  const { t } = useLanguage();

  const statusLabel: Record<string, string> = {
    open:        t("taskDetail_statusOpen"),
    in_progress: t("status_inProgress"),
    done:        t("status_done"),
    cancelled:   t("taskDetail_statusCancelled"),
  };

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const color = ACTION_ITEM_COLOR[item.status] ?? ACTION_ITEM_COLOR.open;
        return (
          <div key={item.id} className="flex items-start gap-3 rounded-lg bg-[#131b2d] px-4 py-3">
            <span className={`material-symbols-outlined text-base shrink-0 mt-0.5 ${color}`}>
              {item.status === "done" ? "check_circle" : item.status === "cancelled" ? "cancel" : "radio_button_unchecked"}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${item.status === "done" ? "line-through text-slate-500" : "text-slate-200"}`}>
                {item.title}
              </p>
              <div className="flex items-center gap-3 mt-1">
                {item.assignee && (
                  <span className="text-[11px] text-slate-500">{item.assignee.name}</span>
                )}
                {item.dueDate && (
                  <span className="text-[11px] text-slate-600">{t("taskDetail_due")} {item.dueDate}</span>
                )}
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${color}`}>
                  {statusLabel[item.status] ?? statusLabel.open}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Activity log panel ───────────────────────────────────────────────────────

function ActivityPanel({ activities }: { activities: TaskActivity[] }) {
  const { t } = useLanguage();
  if (activities.length === 0) return null;

  return (
    <div className="space-y-2">
      {activities.map((a) => (
        <div key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-700/20 last:border-0">
          {a.actor ? (
            <Avatar initials={a.actor.initials} />
          ) : (
            <div className="h-7 w-7 rounded-full bg-[#1a2236] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-sm text-slate-600">smart_toy</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-300">
              <span className="font-medium">{a.actor?.name ?? t("taskDetail_bot")}</span>
              {" "}{a.action === "created" ? t("taskDetail_createdTask") : t("taskDetail_updatedTask")}
            </p>
            {a.changes && Object.keys(a.changes).length > 0 && (
              <div className="mt-1 space-y-0.5">
                {Object.entries(a.changes).map(([field, change]) => (
                  <p key={field} className="text-[11px] text-slate-500">
                    <span className="text-slate-400">{field}</span>: {change}
                  </p>
                ))}
              </div>
            )}
            {a.notes && <p className="text-[11px] text-slate-500 mt-1">{a.notes}</p>}
          </div>
          <span className="text-[10px] text-slate-600 shrink-0">{timeAgo(a.createdAt, t)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Comments panel ───────────────────────────────────────────────────────────

function CommentsPanel({ taskId, comments, canComment }: {
  taskId: string;
  comments: TaskComment[];
  canComment: boolean;
}) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!text.trim()) return;
    startTransition(async () => {
      await addTaskComment(taskId, text);
      setText("");
    });
  }

  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-3">
          <Avatar initials={c.author.initials} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-slate-300">{c.author.name}</span>
              <span className="text-[10px] text-slate-600">{timeAgo(c.createdAt, t)}</span>
            </div>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{c.body}</p>
          </div>
        </div>
      ))}

      {canComment && (
        <div className="flex gap-2 pt-2 border-t border-slate-700/40">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("taskDetail_addComment")}
            rows={2}
            disabled={pending}
            className="bg-[#0e1525] border-slate-700/50 text-slate-100 text-sm resize-none flex-1"
          />
          <Button
            size="sm"
            onClick={submit}
            disabled={pending || !text.trim()}
            className="self-end text-xs h-9"
          >
            {pending ? t("taskDetail_posting") : t("taskDetail_post")}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TaskDetailContent({
  task,
  workstreams,
  userOptions,
  currentUser,
  meetings,
  taskActivities,
  taskComments,
  taskActionItems,
}: TaskDetailContentProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [pending, startTransition] = useTransition();

  const canWrite = !!currentUser && (currentUser.isAdmin || currentUser.isContributor);
  const canDelete = !!currentUser && currentUser.isAdmin;

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? "",
    workstreamId: task.workstreamId ?? "",
    phase: task.phase,
    assigneeId: task.assigneeId ?? "",
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      await updateTask(task.id, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        workstreamId: form.workstreamId,
        assigneeId: form.assigneeId || undefined,
        phase: form.phase,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || undefined,
        isCrossOffice: false,
      });
      router.back();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTask(task.id);
      router.push("/my-tasks");
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="space-y-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          {t("taskDetail_back")}
        </button>
        <div className="flex items-center gap-3">
          <code className="font-mono text-xs text-slate-500 bg-[#2d3448] px-2 py-1 rounded">
            {task.taskCode}
          </code>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#dfc299]">
            {t("taskDetail_label")}
          </span>
        </div>
      </div>

      {/* ── Edit form ────────────────────────────────────────────── */}
      <div className="space-y-5">
        <div>
          <label className="text-[11px] text-slate-400 mb-1.5 block uppercase tracking-wider">
            {t("modal_titleLabel")} *
          </label>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder={t("modal_taskTitlePlaceholder")}
            disabled={!canWrite || pending}
            className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-10"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-400 mb-1.5 block uppercase tracking-wider">
            {t("modal_description")}
          </label>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder={t("modal_descriptionPlaceholder")}
            rows={4}
            disabled={!canWrite || pending}
            className="bg-[#0e1525] border-slate-700/50 text-slate-100 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-slate-400 mb-1.5 block uppercase tracking-wider">
              {t("modal_workstream")} *
            </label>
            <Select value={form.workstreamId} onValueChange={(v) => set("workstreamId", v ?? "")} disabled={!canWrite || pending}>
              <SelectTrigger className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-10">
                <span className="flex-1 text-left truncate">
                  {workstreams.find((w) => w.id === form.workstreamId)?.name ?? <span className="text-slate-500">{t("modal_selectPlaceholder")}</span>}
                </span>
              </SelectTrigger>
              <SelectContent className="bg-[#1a2236] border border-slate-700/60">
                {workstreams.map((ws) => <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1.5 block uppercase tracking-wider">
              {t("modal_phase")}
            </label>
            <Select value={String(form.phase)} onValueChange={(v) => set("phase", Number(v ?? 1) as 1 | 2 | 3)} disabled={!canWrite || pending}>
              <SelectTrigger className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-10">
                <span className="flex-1 text-left">{t("modal_phase")} {form.phase}</span>
              </SelectTrigger>
              <SelectContent className="bg-[#1a2236] border border-slate-700/60">
                <SelectItem value="1">{t("modal_phase")} 1</SelectItem>
                <SelectItem value="2">{t("modal_phase")} 2</SelectItem>
                <SelectItem value="3">{t("modal_phase")} 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-slate-400 mb-1.5 block uppercase tracking-wider">
              {t("modal_assignee")}
            </label>
            <Select value={form.assigneeId} onValueChange={(v) => set("assigneeId", v ?? "")} disabled={!canWrite || pending}>
              <SelectTrigger className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-10">
                <span className="flex-1 text-left truncate">
                  {userOptions.find((u) => u.id === form.assigneeId)?.fullName ?? <span className="text-slate-500">{t("modal_unassigned")}</span>}
                </span>
              </SelectTrigger>
              <SelectContent className="bg-[#1a2236] border border-slate-700/60">
                <SelectItem value="">{t("modal_unassigned")}</SelectItem>
                {userOptions.map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1.5 block uppercase tracking-wider">
              {t("modal_priority")}
            </label>
            <Select value={form.priority} onValueChange={(v) => set("priority", (v ?? "medium") as typeof form.priority)} disabled={!canWrite || pending}>
              <SelectTrigger className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-10">
                <span className="flex-1 text-left">{t(`priority_${form.priority}`)}</span>
              </SelectTrigger>
              <SelectContent className="bg-[#1a2236] border border-slate-700/60">
                <SelectItem value="critical">{t("priority_critical")}</SelectItem>
                <SelectItem value="high">{t("priority_high")}</SelectItem>
                <SelectItem value="medium">{t("priority_medium")}</SelectItem>
                <SelectItem value="low">{t("priority_low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-slate-400 mb-1.5 block uppercase tracking-wider">
              {t("modal_status")}
            </label>
            <Select value={form.status} onValueChange={(v) => set("status", (v ?? "todo") as typeof form.status)} disabled={!canWrite || pending}>
              <SelectTrigger className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-10">
                <span className="flex-1 text-left">
                  {form.status === "in_progress" ? t("status_inProgress") : form.status === "todo" ? t("status_todo") : form.status === "done" ? t("status_done") : form.status === "blocked" ? t("status_blocked") : t("status_review")}
                </span>
              </SelectTrigger>
              <SelectContent className="bg-[#1a2236] border border-slate-700/60">
                <SelectItem value="todo">{t("status_todo")}</SelectItem>
                <SelectItem value="in_progress">{t("status_inProgress")}</SelectItem>
                <SelectItem value="review">{t("status_review")}</SelectItem>
                <SelectItem value="blocked">{t("status_blocked")}</SelectItem>
                <SelectItem value="done">{t("status_done")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1.5 block uppercase tracking-wider">
              {t("modal_dueDate")}
            </label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              disabled={!canWrite || pending}
              className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-10"
            />
          </div>
        </div>
      </div>

      {/* ── Form actions ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-t border-slate-700/40 pt-4">
        {canDelete && (
          confirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{t("modal_deleteConfirm")}</span>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={pending} className="text-xs h-9">
                {t("modal_deleteYes")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmingDelete(false)} disabled={pending} className="text-xs h-9 border-slate-700">
                {t("modal_cancel")}
              </Button>
            </div>
          ) : (
            <Button variant="destructive" size="sm" onClick={() => setConfirmingDelete(true)} disabled={pending} className="text-xs h-9">
              {t("modal_delete")}
            </Button>
          )
        )}
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => router.back()} disabled={pending} className="text-xs h-9 border-slate-700">
          {t("modal_cancel")}
        </Button>
        {canWrite && (
          <Button size="sm" onClick={handleSave} disabled={pending || !form.title.trim() || !form.workstreamId} className="text-xs h-9">
            {pending ? t("modal_saving") : t("modal_save")}
          </Button>
        )}
      </div>

      <Section title={t("taskDetail_meetingHistory")} icon="event_note" count={meetings.length}>
        {meetings.length > 0 ? (
          <MeetingsPanel meetings={meetings} />
        ) : (
          <p className="text-xs text-slate-500">{t("taskDetail_noMeetings")}</p>
        )}
      </Section>

      {taskActionItems.length > 0 && (
        <Section title={t("taskDetail_actionItems")} icon="checklist" count={taskActionItems.length}>
          <ActionItemsPanel items={taskActionItems} />
        </Section>
      )}

      {taskActivities.length > 0 && (
        <Section title={t("taskDetail_activity")} icon="history" count={taskActivities.length}>
          <ActivityPanel activities={taskActivities} />
        </Section>
      )}

      <Section title={t("taskDetail_comments")} icon="chat_bubble" count={taskComments.length}>
        <CommentsPanel
          taskId={task.id}
          comments={taskComments}
          canComment={!!currentUser}
        />
      </Section>

    </div>
  );
}
