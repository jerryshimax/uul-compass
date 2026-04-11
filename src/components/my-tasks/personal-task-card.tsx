"use client";

import { cn, isOverdue, formatDueDate } from "@/lib/utils";
import { Calendar } from "lucide-react";
import type { TaskData } from "@/lib/data/types";

const priorityConfig = {
  critical: {
    label: "Critical",
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/30",
  },
  high: {
    label: "High",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  medium: {
    label: "Medium",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  low: {
    label: "Low",
    bg: "bg-gray-500/15",
    text: "text-gray-400",
    border: "border-gray-500/30",
  },
};

const statusBarColor: Record<TaskData["status"], string> = {
  in_progress: "bg-blue-500",
  blocked: "bg-red-500",
  done: "bg-emerald-500",
  todo: "bg-gray-500",
  review: "bg-amber-500",
};


export function PersonalTaskCard({ task }: { task: TaskData }) {
  const overdue =
    task.dueDate && task.status !== "done" && isOverdue(task.dueDate);
  const p = priorityConfig[task.priority];

  return (
    <div
      className={cn(
        "relative bg-card rounded-xl border border-border/60 p-5 transition-all duration-150 cursor-pointer group overflow-hidden",
        "hover:border-border",
        overdue && "border-red-500/40"
      )}
    >
      {/* Status bar — left edge */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
          statusBarColor[task.status]
        )}
      />

      {/* Top row: task code + priority */}
      <div className="flex items-center gap-2 mb-2.5 pl-2">
        <span className="font-mono text-xs font-semibold text-muted-foreground">
          {task.taskCode}
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border",
            p.bg,
            p.text,
            p.border
          )}
        >
          {p.label}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium leading-snug pl-2 mb-3 group-hover:text-accent transition-colors">
        {task.title}
      </p>

      {/* Bottom row: workstream + due date */}
      <div className="flex items-center justify-between gap-3 pl-2">
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: task.workstreamColor || "#6b7280" }}
          />
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            {task.workstream}
          </span>
        </div>
        {task.dueDate && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs shrink-0",
              overdue
                ? "text-red-400 font-semibold"
                : "text-muted-foreground"
            )}
          >
            <Calendar className="h-3 w-3" />
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}
