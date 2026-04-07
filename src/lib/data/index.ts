// ─── Compass Data Layer ────────────────────────────────────────
// All getters query Supabase via Drizzle ORM.
// Pages are Server Components and just await these functions.

export type {
  TaskData,
  MilestoneData,
  WorkstreamData,
  PhaseData,
  DecisionGate,
  RiskData,
  ValueInitiative,
  ValueSnapshot,
  MetricData,
  PillarMetric,
  PillarSubItem,
  FinancialPulseMetric,
  ActivityItem,
} from "./types";

import { cache } from "react";
import { db } from "@/db";
import {
  pmiTasks,
  pmiWorkstreams,
  pmiMilestones,
  pmiPhases,
  pmiDecisionGates,
  pmiConfig,
  risks as risksTable,
  valueInitiatives,
  valueSnapshots as valueSnapshotsTable,
  users,
} from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { demoScorecard, demoPillarScorecard, demoAllMetrics, demoFinancialPulse } from "./demo/metrics";
import { isOverdue, calcDayNumber, formatDueDate } from "@/lib/utils";
import type {
  TaskData,
  MilestoneData,
  WorkstreamData,
  PhaseData,
  DecisionGate,
  RiskData,
  ValueInitiative,
  ValueSnapshot,
} from "./types";
import {
  demoVerticals, demoReps, demoAlerts, demoPipelineStages,
  demoVelocityTrends, demoForecast, demoActivityHeatmap, demoSalesKPIs,
} from "./demo/sales";

// ─── Private helpers ───────────────────────────────────────────

function makeInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function toMonthLabel(dateStr: string): string {
  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [y, m] = dateStr.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

// Convert a display or ISO date string to a day number relative to project start
function dateToDayNumber(dateStr: string): number {
  const startIso = "2026-04-01";
  const [sy, sm, sd] = startIso.split("-").map(Number);
  const projectStart = new Date(sy, sm - 1, sd);

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const target = new Date(y, m - 1, d);
    return Math.floor((target.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const parts = dateStr.split(" ");
  if (parts.length !== 2 || months[parts[0]] === undefined) return 999;
  const day = parseInt(parts[1]);
  if (isNaN(day)) return 999;
  const target = new Date(projectStart.getFullYear(), months[parts[0]], day);
  return Math.floor((target.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

// ─── Primary getters ───────────────────────────────────────────

export const getTasks = cache(async (): Promise<TaskData[]> => {
  const rows = await db
    .select({
      t: {
        id: pmiTasks.id,
        taskCode: pmiTasks.taskCode,
        title: pmiTasks.title,
        description: pmiTasks.description,
        status: pmiTasks.status,
        priority: pmiTasks.priority,
        dueDate: pmiTasks.dueDate,
        phase: pmiTasks.phase,
        milestoneId: pmiTasks.milestoneId,
        isCrossOffice: pmiTasks.isCrossOffice,
        sortOrder: pmiTasks.sortOrder,
      },
      ws: {
        name: pmiWorkstreams.name,
        color: pmiWorkstreams.color,
      },
      u: {
        fullName: users.fullName,
      },
    })
    .from(pmiTasks)
    .leftJoin(pmiWorkstreams, eq(pmiTasks.workstreamId, pmiWorkstreams.id))
    .leftJoin(users, eq(pmiTasks.assigneeId, users.id))
    .orderBy(asc(pmiTasks.sortOrder));

  return rows.map(({ t, ws, u }) => ({
    id: t.id,
    taskCode: t.taskCode ?? "",
    title: t.title,
    description: t.description ?? undefined,
    status: t.status as TaskData["status"],
    priority: t.priority as TaskData["priority"],
    assignee: u
      ? { name: u.fullName, initials: makeInitials(u.fullName) }
      : undefined,
    dueDate: t.dueDate ? formatDueDate(t.dueDate) : undefined,
    workstream: ws?.name ?? "",
    workstreamColor: ws?.color ?? undefined,
    phase: (t.phase ?? 1) as 1 | 2 | 3,
    milestoneId: t.milestoneId ?? undefined,
    isCrossOffice: t.isCrossOffice,
  }));
});

export async function getWorkstreams(): Promise<WorkstreamData[]> {
  const [tasks, rows] = await Promise.all([
    getTasks(),
    db.select().from(pmiWorkstreams).orderBy(asc(pmiWorkstreams.sortOrder)),
  ]);

  return rows.map((ws) => {
    const wsTasks = tasks.filter((t) => t.workstream === ws.name);
    return {
      id: ws.id,
      name: ws.name,
      color: ws.color ?? "#6b7280",
      taskCount: wsTasks.length,
      completed: wsTasks.filter((t) => t.status === "done").length,
      targetCompletion: ws.targetCompletion ?? 0,
    };
  });
}

export async function getMilestones(): Promise<MilestoneData[]> {
  const [tasks, rows] = await Promise.all([
    getTasks(),
    db
      .select()
      .from(pmiMilestones)
      .leftJoin(pmiWorkstreams, eq(pmiMilestones.workstreamId, pmiWorkstreams.id))
      .orderBy(asc(pmiMilestones.sortOrder)),
  ]);

  return rows.map(({ pmi_milestones: m, pmi_workstreams: ws }) => {
    const linked = tasks.filter((t) => t.milestoneId === m.id);
    return {
      id: m.id,
      code: m.code ?? "",
      name: m.name,
      workstream: ws?.name ?? "",
      workstreamColor: ws?.color ?? "#6b7280",
      targetDate: formatDueDate(m.targetDate) ?? "",
      status: m.status as MilestoneData["status"],
      phase: (m.phase ?? 1) as 1 | 2 | 3,
      linkedTaskCount: linked.length,
      completedTaskCount: linked.filter((t) => t.status === "done").length,
    };
  });
}

export async function getPhases(): Promise<PhaseData[]> {
  const rows = await db.select().from(pmiPhases).orderBy(asc(pmiPhases.phaseNumber));
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    phaseNumber: p.phaseNumber as 1 | 2 | 3,
    subtitle: p.description ?? "",
    startDay: p.startDay,
    endDay: p.endDay,
    startDate: p.startDate ?? "",
    endDate: p.endDate ?? "",
    status: p.status as PhaseData["status"],
  }));
}

export async function getGates(): Promise<DecisionGate[]> {
  const rows = await db
    .select()
    .from(pmiDecisionGates)
    .orderBy(asc(pmiDecisionGates.targetDay));

  return rows.map((g) => ({
    id: g.id,
    name: g.name,
    dayNumber: g.targetDay,
    targetDate: g.targetDate ?? "",
    phaseId: g.phaseId,
    status: g.status as DecisionGate["status"],
    criteria: ((g.criteria ?? []) as { criterion: string; met: boolean }[]).map(
      (c) => c.criterion
    ),
    owner: g.ownerLabel ?? "",
    outcome: g.outcome ?? undefined,
  }));
}

export async function getNextGate(): Promise<DecisionGate | undefined> {
  const gates = await getGates();
  return gates.find((g) => g.status === "upcoming" || g.status === "ready");
}

export async function getRisks(): Promise<RiskData[]> {
  const rows = await db
    .select()
    .from(risksTable)
    .leftJoin(users, eq(risksTable.ownerId, users.id))
    .leftJoin(pmiWorkstreams, eq(risksTable.workstreamId, pmiWorkstreams.id));

  return rows.map(({ risks: r, users: u, pmi_workstreams: ws }) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    severity: r.severity as RiskData["severity"],
    status: r.status as RiskData["status"],
    mitigationPlan: r.mitigationPlan ?? "",
    owner: u
      ? { name: u.fullName, initials: makeInitials(u.fullName) }
      : { name: "Unassigned", initials: "?" },
    targetDate: r.targetDate ?? undefined,
    workstream: ws?.name ?? undefined,
    linkedTaskCodes: r.linkedTaskCodes ?? [],
  }));
}

export async function getValueInitiatives(): Promise<ValueInitiative[]> {
  const rows = await db
    .select()
    .from(valueInitiatives)
    .leftJoin(users, eq(valueInitiatives.ownerId, users.id))
    .leftJoin(pmiWorkstreams, eq(valueInitiatives.workstreamId, pmiWorkstreams.id));

  return rows.map(({ value_initiatives: v, users: u, pmi_workstreams: ws }) => ({
    id: v.id,
    name: v.name,
    category: v.category as ValueInitiative["category"],
    description: v.description ?? "",
    targetDescription: v.targetDescription ?? "",
    plannedImpact: Math.round((v.plannedImpactCents ?? 0) / 100),
    capturedImpact: Math.round((v.capturedImpactCents ?? 0) / 100),
    status: v.status as ValueInitiative["status"],
    owner: u
      ? { name: u.fullName, initials: makeInitials(u.fullName) }
      : { name: "Unassigned", initials: "?" },
    workstream: ws?.name ?? undefined,
  }));
}

export async function getValueSnapshots(): Promise<ValueSnapshot[]> {
  const rows = await db
    .select({
      snapshotDate: valueSnapshotsTable.snapshotDate,
      plannedCents: sql<number>`sum(${valueSnapshotsTable.runRateCents})`,
      capturedCents: sql<number>`sum(${valueSnapshotsTable.cumulativeCents})`,
    })
    .from(valueSnapshotsTable)
    .groupBy(valueSnapshotsTable.snapshotDate)
    .orderBy(asc(valueSnapshotsTable.snapshotDate));

  return rows
    .filter((r) => r.snapshotDate)
    .map((r) => ({
      month: toMonthLabel(r.snapshotDate!),
      planned: Math.round((r.plannedCents ?? 0) / 100),
      captured: Math.round((r.capturedCents ?? 0) / 100),
    }));
}

export async function getCurrentDay(): Promise<number> {
  const rows = await db.select().from(pmiConfig).limit(1);
  const config = rows[0];
  if (config?.startDate) {
    return calcDayNumber(config.startDate, config.totalDays);
  }
  return calcDayNumber("2026-04-01", 100);
}

// ─── Derived getters ───────────────────────────────────────────

export async function getTasksByAssignee(name: string): Promise<TaskData[]> {
  const all = await getTasks();
  return all.filter((t) => t.assignee?.name === name);
}

export async function getTasksByPhase(phase: 1 | 2 | 3): Promise<TaskData[]> {
  const all = await getTasks();
  return all.filter((t) => t.phase === phase);
}

export async function getTasksByWorkstream(workstream: string): Promise<TaskData[]> {
  const all = await getTasks();
  return all.filter((t) => t.workstream === workstream);
}

export async function getTasksForRisk(riskId: string): Promise<TaskData[]> {
  const [riskList, tasks] = await Promise.all([getRisks(), getTasks()]);
  const risk = riskList.find((r) => r.id === riskId);
  if (!risk) return [];
  return tasks.filter((t) => risk.linkedTaskCodes.includes(t.taskCode));
}

export async function getLinkedTasksMap(): Promise<Record<string, TaskData[]>> {
  const [riskList, tasks] = await Promise.all([getRisks(), getTasks()]);
  const map: Record<string, TaskData[]> = {};
  for (const risk of riskList) {
    map[risk.id] = tasks.filter((t) => risk.linkedTaskCodes.includes(t.taskCode));
  }
  return map;
}

export async function getTaskStats() {
  const all = await getTasks();
  const done = all.filter((t) => t.status === "done").length;
  const active = all.filter((t) => t.status === "in_progress").length;
  const blocked = all.filter((t) => t.status === "blocked").length;
  const overdue = all.filter(
    (t) => t.dueDate && t.status !== "done" && isOverdue(t.dueDate)
  ).length;
  return { total: all.length, done, active, blocked, overdue, open: all.length - done };
}

export async function getNeedsAttention(): Promise<TaskData[]> {
  const all = await getTasks();
  return all.filter(
    (t) =>
      t.status === "blocked" ||
      (t.dueDate && t.status !== "done" && isOverdue(t.dueDate))
  );
}

export async function getUpcomingMilestones(limit = 5): Promise<MilestoneData[]> {
  const all = await getMilestones();
  return all.filter((m) => m.status !== "completed").slice(0, limit);
}

export async function getTasksDueThisWeek(): Promise<TaskData[]> {
  const [tasks, currentDay] = await Promise.all([getTasks(), getCurrentDay()]);
  return tasks.filter((t) => {
    if (!t.dueDate || t.status === "done") return false;
    const dayNum = dateToDayNumber(t.dueDate);
    return dayNum >= currentDay && dayNum <= currentDay + 7;
  });
}

export async function getUpcomingDecisions() {
  const [gates, tasks, currentDay] = await Promise.all([
    getGates(),
    getTasks(),
    getCurrentDay(),
  ]);
  const upcomingGates = gates.filter(
    (g) =>
      g.status === "upcoming" &&
      g.dayNumber >= currentDay &&
      g.dayNumber <= currentDay + 14
  );
  const criticalTasks = tasks.filter((t) => {
    if (t.priority !== "critical" || t.status === "done" || !t.dueDate) return false;
    const dayNum = dateToDayNumber(t.dueDate);
    return dayNum >= currentDay && dayNum <= currentDay + 14;
  });
  return { gates: upcomingGates, criticalTasks };
}

// ─── Hardcoded (no DB table) ───────────────────────────────────

export function getScorecard() {
  return demoScorecard;
}

export function getPillarScorecard() {
  return demoPillarScorecard;
}

export function getAllMetrics() {
  return demoAllMetrics;
}

export function getFinancialPulse() {
  return demoFinancialPulse;
}

export function getSalesData() {
  return {
    verticals: demoVerticals,
    reps: demoReps,
    alerts: demoAlerts,
    pipelineStages: demoPipelineStages,
    velocityTrends: demoVelocityTrends,
    forecast: demoForecast,
    activityHeatmap: demoActivityHeatmap,
    kpis: demoSalesKPIs,
  };
}
