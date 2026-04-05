import { KanbanBoard } from "@/components/plan/kanban-board";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { TaskData } from "@/components/plan/task-card";
import { Target } from "lucide-react";

// Demo data — will be replaced with Supabase queries
const workstreams = [
  { name: "Finance Integration", color: "#ef4444", taskCount: 12, completed: 1 },
  { name: "Operations Consolidation", color: "#f97316", taskCount: 10, completed: 0 },
  { name: "Sales Engine", color: "#3b82f6", taskCount: 8, completed: 1 },
  { name: "Brand & Marketing", color: "#8b5cf6", taskCount: 12, completed: 3 },
  { name: "Technology & AI", color: "#06b6d4", taskCount: 9, completed: 0 },
  { name: "Organization & HR", color: "#22c55e", taskCount: 6, completed: 0 },
];

const demoTasks: TaskData[] = [
  // Finance Integration
  { id: "1", title: "Demand Silfab 30% AR prepayment before port arrival", status: "in_progress", priority: "critical", assignee: { name: "Jason Likens", initials: "JL" }, dueDate: "Apr 7", workstream: "Finance", workstreamColor: "#ef4444" },
  { id: "2", title: "Evaluate bridge financing need ($300-500K)", status: "todo", priority: "high", assignee: { name: "Jerry Shi", initials: "JS" }, dueDate: "Apr 30", workstream: "Finance", workstreamColor: "#ef4444" },
  { id: "3", title: "VP Finance hire — post job description", status: "todo", priority: "critical", assignee: { name: "Jerry Shi", initials: "JS" }, dueDate: "Apr 4", workstream: "Finance", workstreamColor: "#ef4444" },
  { id: "4", title: "AR factoring RFPs to OTR, eCapital, Riviera", status: "in_progress", priority: "high", assignee: { name: "Jason Likens", initials: "JL" }, dueDate: "Apr 5", workstream: "Finance", workstreamColor: "#ef4444" },
  { id: "5", title: "Prepare legal recovery procedures for Plan C", status: "todo", priority: "medium", assignee: { name: "Jerry Shi", initials: "JS" }, workstream: "Finance", workstreamColor: "#ef4444" },
  // Operations Consolidation
  { id: "6", title: "Consolidate all carrier contracts + pricing into clearinghouse", status: "todo", priority: "critical", assignee: { name: "Marco", initials: "MC" }, dueDate: "Apr 15", workstream: "Operations", workstreamColor: "#f97316" },
  { id: "7", title: "Marco CC Jerry & Alic on all carrier communications", status: "in_progress", priority: "high", workstream: "Operations", workstreamColor: "#f97316" },
  { id: "8", title: "Finalize Meihang/Star Navigation/UUL incentive alignment", status: "in_progress", priority: "high", assignee: { name: "Alic Ge", initials: "AG" }, workstream: "Operations", workstreamColor: "#f97316" },
  { id: "9", title: "Negotiate MSC, CMA, Golden Standard contracts", status: "todo", priority: "medium", assignee: { name: "Marco", initials: "MC" }, workstream: "Operations", workstreamColor: "#f97316" },
  { id: "10", title: "Shenzhen warehouse expansion proposal", status: "blocked", priority: "high", assignee: { name: "Jerry Shi", initials: "JS" }, dueDate: "Apr 3", workstream: "Operations", workstreamColor: "#f97316" },
  // Sales Engine
  { id: "11", title: "Collect Target Account list from Mike & Gabe", status: "todo", priority: "high", assignee: { name: "Jerry Shi", initials: "JS" }, dueDate: "Apr 5", workstream: "Sales", workstreamColor: "#3b82f6" },
  { id: "12", title: "Build DataMine API for customer freight history", status: "todo", priority: "medium", assignee: { name: "Jerry Shi", initials: "JS" }, workstream: "Sales", workstreamColor: "#3b82f6" },
  { id: "13", title: "Foxconn meeting prep (Steve Zhi IPP advisory)", status: "todo", priority: "medium", assignee: { name: "Jerry Shi", initials: "JS" }, dueDate: "Apr 13", workstream: "Sales", workstreamColor: "#3b82f6" },
  // Brand & Marketing
  { id: "14", title: "Brand Narrative Memo v1 (Master Marketing Memo) — North Star for all marketing", status: "done", priority: "critical", assignee: { name: "Jerry Shi", initials: "JS" }, dueDate: "Apr 3", workstream: "Marketing", workstreamColor: "#8b5cf6" },
  { id: "15", title: "Ben Fogarty DocuSign + kickoff", status: "done", priority: "high", assignee: { name: "Jerry Shi", initials: "JS" }, workstream: "Marketing", workstreamColor: "#8b5cf6" },
  { id: "14b", title: "Mid-week deck review with Ben", status: "todo", priority: "high", assignee: { name: "Jerry Shi", initials: "JS" }, dueDate: "Apr 7", workstream: "Marketing", workstreamColor: "#8b5cf6" },
  { id: "14c", title: "Final deck delivery from Ben", status: "todo", priority: "high", assignee: { name: "Ben Fogarty", initials: "BF" }, dueDate: "Apr 10", workstream: "Marketing", workstreamColor: "#8b5cf6" },
  { id: "14d", title: "Team bios — Jason, Jerry, Alic (American audience framing)", status: "todo", priority: "high", workstream: "Marketing", workstreamColor: "#8b5cf6" },
  { id: "14e", title: "Case study confirmation — AIP Corp Monarch referencability", status: "todo", priority: "medium", workstream: "Marketing", workstreamColor: "#8b5cf6" },
  { id: "14f", title: "UUL Compass platform screenshots / demo video", status: "todo", priority: "medium", workstream: "Marketing", workstreamColor: "#8b5cf6" },
  { id: "16", title: "Lock key stats for all marketing materials (needs Jason input on service architecture)", status: "todo", priority: "medium", workstream: "Marketing", workstreamColor: "#8b5cf6" },
  // Technology & AI
  { id: "17", title: "Deploy Compass OS (this system)", status: "in_progress", priority: "critical", assignee: { name: "David Wu", initials: "DW" }, dueDate: "Apr 7", workstream: "Technology", workstreamColor: "#06b6d4" },
  { id: "18", title: "Pallet pricing pilot — 95% complete, finalize", status: "in_progress", priority: "high", assignee: { name: "Jason Likens", initials: "JL" }, workstream: "Technology", workstreamColor: "#06b6d4" },
  { id: "19", title: "Define full-chain data architecture for AIOS", status: "todo", priority: "high", assignee: { name: "Jerry Shi", initials: "JS" }, workstream: "Technology", workstreamColor: "#06b6d4" },
  // Organization & HR
  { id: "20", title: "Board seat assignments confirmed", status: "done", priority: "high", workstream: "Org & HR", workstreamColor: "#22c55e" },
  { id: "21", title: "Jason CEO + Josh COO appointments announced", status: "done", priority: "high", workstream: "Org & HR", workstreamColor: "#22c55e" },
  { id: "22", title: "Evaluate Marco retention/loyalty risk", status: "todo", priority: "high", assignee: { name: "Alic Ge", initials: "AG" }, workstream: "Org & HR", workstreamColor: "#22c55e" },
];

export default function PlanPage() {
  const totalTasks = demoTasks.length;
  const doneTasks = demoTasks.filter((t) => t.status === "done").length;
  const pct = Math.round((doneTasks / totalTasks) * 100);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/5">
            <Target className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">100-Day Plan</h1>
            <p className="text-xs text-muted-foreground">
              Apr 1 — Jul 10, 2026 &middot; {doneTasks}/{totalTasks} tasks done
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold tabular-nums text-muted-foreground">{pct}%</span>
          <Progress value={pct} className="w-32 h-1.5" />
        </div>
      </div>

      {/* Workstream pills */}
      <div className="flex flex-wrap gap-2">
        {workstreams.map((ws) => (
          <button
            key={ws.name}
            className="flex items-center gap-2 py-1.5 px-3 rounded-lg border border-border/60 bg-card hover:bg-muted/50 transition-colors text-xs"
          >
            <div
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: ws.color }}
            />
            <span className="font-medium">{ws.name}</span>
            <span className="text-muted-foreground tabular-nums">
              {ws.completed}/{ws.taskCount}
            </span>
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      <KanbanBoard tasks={demoTasks} />
    </div>
  );
}
