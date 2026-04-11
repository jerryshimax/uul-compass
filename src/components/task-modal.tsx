"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import type { TaskData, WorkstreamData, UserOption } from "@/lib/data";
import type { CurrentUser } from "@/lib/supabase/get-current-user";
import { createTask, updateTask, deleteTask } from "@/lib/actions/tasks";
import { useLanguage } from "@/lib/i18n/context";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  task?: TaskData | null;
  workstreams: WorkstreamData[];
  userOptions: UserOption[];
  currentUser: CurrentUser;
}

const defaultForm = {
  title: "",
  description: "",
  workstreamId: "",
  phase: 1 as 1 | 2 | 3,
  assigneeId: "",
  priority: "medium" as "critical" | "high" | "medium" | "low",
  status: "todo" as "todo" | "in_progress" | "blocked" | "review" | "done",
  dueDate: "",
  isCrossOffice: false,
};

export function TaskModal({
  open,
  onClose,
  task,
  workstreams,
  userOptions,
  currentUser,
}: TaskModalProps) {
  const [form, setForm] = useState(defaultForm);
  const [pending, startTransition] = useTransition();
  const { t } = useLanguage();

  const isEdit = !!task;
  const canWrite = currentUser.isAdmin || currentUser.isContributor;
  const canDelete = isEdit && currentUser.isAdmin;

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
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
    } else {
      setForm(defaultForm);
    }
  }, [open, task?.id]);

  function set<K extends keyof typeof defaultForm>(key: K, value: (typeof defaultForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    startTransition(async () => {
      const data = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        workstreamId: form.workstreamId,
        assigneeId: form.assigneeId || undefined,
        phase: form.phase,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || undefined,
        isCrossOffice: form.isCrossOffice,
      };
      if (isEdit) {
        await updateTask(task!.id, data);
      } else {
        await createTask(data);
      }
      onClose();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTask(task!.id);
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#131b2d] border-slate-700/50 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-100 text-base">
            {isEdit ? t("modal_editTask") : t("modal_newTask")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          {/* Title */}
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block uppercase tracking-wider">{t("modal_titleLabel")} *</label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={t("modal_taskTitlePlaceholder")}
              disabled={!canWrite || pending}
              className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-9 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block uppercase tracking-wider">{t("modal_description")}</label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={t("modal_descriptionPlaceholder")}
              rows={3}
              disabled={!canWrite || pending}
              className="bg-[#0e1525] border-slate-700/50 text-slate-100 text-sm resize-none"
            />
          </div>

          {/* Workstream + Phase */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block uppercase tracking-wider">{t("modal_workstream")} *</label>
              <Select
                value={form.workstreamId}
                onValueChange={(v) => set("workstreamId", v ?? "")}
                disabled={!canWrite || pending}
              >
                <SelectTrigger className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-9 text-sm">
                  <span className="flex-1 text-left truncate">
                    {workstreams.find((w) => w.id === form.workstreamId)?.name
                      ?? <span className="text-slate-500">{t("modal_selectPlaceholder")}</span>}
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
              <label className="text-[11px] text-slate-400 mb-1 block uppercase tracking-wider">{t("modal_phase")}</label>
              <Select
                value={String(form.phase)}
                onValueChange={(v) => set("phase", Number(v ?? 1) as 1 | 2 | 3)}
                disabled={!canWrite || pending}
              >
                <SelectTrigger className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-9 text-sm">
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

          {/* Assignee + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block uppercase tracking-wider">{t("modal_assignee")}</label>
              <Select
                value={form.assigneeId}
                onValueChange={(v) => set("assigneeId", v ?? "")}
                disabled={!canWrite || pending}
              >
                <SelectTrigger className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-9 text-sm">
                  <span className="flex-1 text-left truncate">
                    {userOptions.find((u) => u.id === form.assigneeId)?.fullName
                      ?? <span className="text-slate-500">{t("modal_unassigned")}</span>}
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
              <label className="text-[11px] text-slate-400 mb-1 block uppercase tracking-wider">{t("modal_priority")}</label>
              <Select
                value={form.priority}
                onValueChange={(v) => set("priority", (v ?? "medium") as typeof form.priority)}
                disabled={!canWrite || pending}
              >
                <SelectTrigger className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-9 text-sm">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block uppercase tracking-wider">{t("modal_status")}</label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", (v ?? "todo") as typeof form.status)}
                disabled={!canWrite || pending}
              >
                <SelectTrigger className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-9 text-sm">
                  <span className="flex-1 text-left">{t(form.status === "in_progress" ? "status_inProgress" : form.status === "todo" ? "status_todo" : form.status === "done" ? "status_done" : form.status === "blocked" ? "status_blocked" : "status_review")}</span>
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
              <label className="text-[11px] text-slate-400 mb-1 block uppercase tracking-wider">{t("modal_dueDate")}</label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                disabled={!canWrite || pending}
                className="bg-[#0e1525] border-slate-700/50 text-slate-100 h-9 text-sm"
              />
            </div>
          </div>

        </div>

        <DialogFooter className="flex items-center gap-2 pt-2">
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={pending}
              className="mr-auto text-xs h-8"
            >
              {t("modal_delete")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={pending}
            className="text-xs h-8 border-slate-700"
          >
            {t("modal_cancel")}
          </Button>
          {canWrite && (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={pending || !form.title.trim() || !form.workstreamId}
              className="text-xs h-8"
            >
              {pending ? t("modal_saving") : isEdit ? t("modal_save") : t("modal_create")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
