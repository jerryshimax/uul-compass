import {
  getTaskStats,
  getPhases,
  getGates,
  getPillarScorecard,
  getFinancialPulse,
  getNeedsAttention,
  getUpcomingDecisions,
  getCurrentDay,
  getTasks,
  getWorkstreams,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { DashboardContent } from "./dashboard-content";
import { formatDueDate } from "@/lib/utils";

export default async function DashboardPage() {
  const [
    stats,
    phases,
    gates,
    attentionTasks,
    decisions,
    currentDay,
    allTasks,
    workstreams,
    currentUser,
  ] = await Promise.all([
    getTaskStats(),
    getPhases(),
    getGates(),
    getNeedsAttention(),
    getUpcomingDecisions(),
    getCurrentDay(),
    getTasks(),
    getWorkstreams(),
    getCurrentUser(),
  ]);
  const pillars = getPillarScorecard();
  const financialPulse = getFinancialPulse();

  const attentionItems = [
    ...decisions.gates.map((g) => ({
      type: "gate" as const,
      id: g.id,
      title: g.name,
      subtitle: `${g.owner} · ${g.targetDate}`,
      badge: `Day ${g.dayNumber}`,
      badgeColor: "text-[#dfc299]",
      borderColor: "border-[#dfc299]",
    })),
    ...attentionTasks.map((t) => ({
      type: "task" as const,
      id: t.id,
      title: t.title,
      subtitle: `${t.assignee?.name || "Unassigned"}${t.dueDate ? ` · Due ${formatDueDate(t.dueDate)}` : ""}`,
      badge: t.status === "blocked" ? "Blocked" : "Overdue",
      badgeColor: t.status === "blocked" ? "text-red-400" : "text-amber-400",
      borderColor: t.status === "blocked" ? "border-red-400" : "border-amber-400",
      taskCode: t.taskCode,
      workstreamColor: t.workstreamColor,
    })),
    ...decisions.criticalTasks
      .filter((ct) => !attentionTasks.some((at) => at.id === ct.id))
      .map((t) => ({
        type: "task" as const,
        id: t.id,
        title: t.title,
        subtitle: `${t.assignee?.name || "Unassigned"}${t.dueDate ? ` · Due ${formatDueDate(t.dueDate)}` : ""}`,
        badge: "Critical",
        badgeColor: "text-red-400",
        borderColor: "border-red-400",
        taskCode: t.taskCode,
        workstreamColor: t.workstreamColor,
      })),
  ];

  const myTasks = currentUser
    ? allTasks.filter((t) => t.assigneeId === currentUser.id)
    : [];

  return (
    <DashboardContent
      currentDay={currentDay}
      stats={stats}
      phases={phases}
      gates={gates}
      attentionItems={attentionItems}
      financialPulse={financialPulse}
      pillars={pillars}
      myTasks={myTasks}
      allTasks={allTasks}
      workstreams={workstreams}
    />
  );
}
