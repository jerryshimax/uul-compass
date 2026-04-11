"use server";

import { db } from "@/db";
import { pmiTasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "review" | "done";
export type TaskPriority = "critical" | "high" | "medium" | "low";

export interface TaskInput {
  title: string;
  description?: string;
  workstreamId: string;
  milestoneId?: string;
  assigneeId?: string;
  phase: 1 | 2 | 3;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO: "2026-04-07"
  isCrossOffice?: boolean;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/my-tasks");
  revalidatePath("/tasks", "layout");
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  await db
    .update(pmiTasks)
    .set({ status, updatedAt: new Date() })
    .where(eq(pmiTasks.id, taskId));
  revalidateAll();
}

export async function createTask(data: TaskInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (!currentUser.isAdmin && !currentUser.isContributor)) {
    throw new Error("Unauthorized");
  }

  await db.insert(pmiTasks).values({
    workstreamId: data.workstreamId,
    milestoneId: data.milestoneId || null,
    assigneeId: data.assigneeId || null,
    reporterId: currentUser.id,
    title: data.title,
    description: data.description || null,
    phase: data.phase,
    status: data.status,
    priority: data.priority,
    dueDate: data.dueDate || null,
    isCrossOffice: data.isCrossOffice ?? false,
  });

  revalidateAll();
}

export async function updateTask(taskId: string, data: TaskInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (!currentUser.isAdmin && !currentUser.isContributor)) {
    throw new Error("Unauthorized");
  }

  await db
    .update(pmiTasks)
    .set({
      title: data.title,
      description: data.description || null,
      workstreamId: data.workstreamId,
      milestoneId: data.milestoneId || null,
      assigneeId: data.assigneeId || null,
      phase: data.phase,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate || null,
      isCrossOffice: data.isCrossOffice ?? false,
      updatedAt: new Date(),
    })
    .where(eq(pmiTasks.id, taskId));

  revalidateAll();
}

export async function deleteTask(taskId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.isAdmin) {
    throw new Error("Unauthorized");
  }

  await db.delete(pmiTasks).where(eq(pmiTasks.id, taskId));
  revalidateAll();
}
