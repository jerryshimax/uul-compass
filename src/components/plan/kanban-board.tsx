"use client";

import { TaskCard } from "./task-card";
import type { TaskData } from "@/lib/data/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const columns = [
  { key: "todo" as const, label: "To Do", dotColor: "bg-slate-400", headerBg: "bg-slate-50" },
  { key: "in_progress" as const, label: "In Progress", dotColor: "bg-sky-500", headerBg: "bg-sky-50/60" },
  { key: "blocked" as const, label: "Blocked", dotColor: "bg-red-500", headerBg: "bg-red-50/60" },
  { key: "review" as const, label: "Review", dotColor: "bg-amber-500", headerBg: "bg-amber-50/60" },
  { key: "done" as const, label: "Done", dotColor: "bg-emerald-500", headerBg: "bg-emerald-50/60" },
];

interface KanbanBoardProps {
  tasks: TaskData[];
}

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 min-w-[900px] md:min-w-[1100px] pb-4">
        {columns.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="flex-1 min-w-[180px] md:min-w-[210px]">
              {/* Column header */}
              <div className={cn(
                "flex items-center gap-2 mb-3 px-3 py-2.5 rounded-xl border border-transparent",
                col.headerBg
              )}>
                <div className={cn("h-2 w-2 rounded-full", col.dotColor)} />
                <span className="text-xs font-semibold tracking-wide">{col.label}</span>
                <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-md bg-background/80 text-[10px] font-semibold text-muted-foreground ml-auto tabular-nums">
                  {columnTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2.5">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {columnTasks.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-border/40 p-8 text-center">
                    <p className="text-xs text-muted-foreground/60">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
