"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TaskData, WorkstreamData, UserOption } from "@/lib/data";
import type { CurrentUser } from "@/lib/supabase/get-current-user";
import { updateTask, deleteTask } from "@/lib/actions/tasks";
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
}

export function TaskDetailContent({
  task,
  workstreams,
  userOptions,
  currentUser,
}: TaskDetailContentProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [pending, startTransition] = useTransition();

  const canWrite = !!currentUser && (currentUser.isAdmin || currentUser.isContributor);
  const canDelete = !!currentUser && currentUser.isAdmin;

  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? "",
    workstreamId: task.workstreamId ?? "",
    phase: task.phase,
    assigneeId: task.assigneeId ?? "",
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ?? "",
    isCrossOffice: task.isCrossOffice ?? false,
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
        isCrossOffice: form.isCrossOffice,
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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <div className="flex items-center gap-3">
          <code className="font-mono text-xs text-slate-500 bg-[#2d3448] px-2 py-1 rounded">
            {task.taskCode}
          </code>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#dfc299]">
            Task Detail
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Title */}
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

        {/* Description */}
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

        {/* Workstream + Phase */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-slate-400 mb-1.5 block uppercase tracking-wider">
              {t("modal_workstream")} *
            </label>
            <Select
              value={form.workstreamId}
              onValueChange={(v) => set("workstreamId", v ?? "")}
              disabled={!canWrite || pending}
            >
              <SelectTrigger className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-10">
                <span className="flex-1 text-left truncate">
                  {workstreams.find((w) => w.id === form.workstreamId)?.name ?? (
                    <span className="text-slate-500">{t("modal_selectPlaceholder")}</span>
                  )}
                </span>
              </SelectTrigger>
              <SelectContent className="bg-[#1a2236] border border-slate-700/60">
                {workstreams.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1.5 block uppercase tracking-wider">
              {t("modal_phase")}
            </label>
            <Select
              value={String(form.phase)}
              onValueChange={(v) => set("phase", Number(v ?? 1) as 1 | 2 | 3)}
              disabled={!canWrite || pending}
            >
              <SelectTrigger className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-10">
                <span className="flex-1 text-left">
                  {t("modal_phase")} {form.phase}
                </span>
              </SelectTrigger>
              <SelectContent className="bg-[#1a2236] border border-slate-700/60">
                <SelectItem value="1">{t("modal_phase")} 1</SelectItem>
                <SelectItem value="2">{t("modal_phase")} 2</SelectItem>
                <SelectItem value="3">{t("modal_phase")} 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Assignee + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-slate-400 mb-1.5 block uppercase tracking-wider">
              {t("modal_assignee")}
            </label>
            <Select
              value={form.assigneeId}
              onValueChange={(v) => set("assigneeId", v ?? "")}
              disabled={!canWrite || pending}
            >
              <SelectTrigger className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-10">
                <span className="flex-1 text-left truncate">
                  {userOptions.find((u) => u.id === form.assigneeId)?.fullName ?? (
                    <span className="text-slate-500">{t("modal_unassigned")}</span>
                  )}
                </span>
              </SelectTrigger>
              <SelectContent className="bg-[#1a2236] border border-slate-700/60">
                <SelectItem value="">{t("modal_unassigned")}</SelectItem>
                {userOptions.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1.5 block uppercase tracking-wider">
              {t("modal_priority")}
            </label>
            <Select
              value={form.priority}
              onValueChange={(v) => set("priority", (v ?? "medium") as typeof form.priority)}
              disabled={!canWrite || pending}
            >
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

        {/* Status + Due Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-slate-400 mb-1.5 block uppercase tracking-wider">
              {t("modal_status")}
            </label>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", (v ?? "todo") as typeof form.status)}
              disabled={!canWrite || pending}
            >
              <SelectTrigger className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-10">
                <span className="flex-1 text-left">
                  {form.status === "in_progress"
                    ? t("status_inProgress")
                    : form.status === "todo"
                    ? t("status_todo")
                    : form.status === "done"
                    ? t("status_done")
                    : form.status === "blocked"
                    ? t("status_blocked")
                    : t("status_review")}
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

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-700/40">
        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={pending}
            className="text-xs h-9"
          >
            {t("modal_delete")}
          </Button>
        )}
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          disabled={pending}
          className="text-xs h-9 border-slate-700"
        >
          {t("modal_cancel")}
        </Button>
        {canWrite && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={pending || !form.title.trim() || !form.workstreamId}
            className="text-xs h-9"
          >
            {pending ? t("modal_saving") : t("modal_save")}
          </Button>
        )}
      </div>
    </div>
  );
}
