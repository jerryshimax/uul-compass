import { NextRequest } from "next/server";
import { db } from "@/db";
import { pmiTasks, pmiWorkstreams, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyBearerToken, unauthorizedResponse } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  if (!verifyBearerToken(request)) return unauthorizedResponse();

  const tasks = await db
    .select({
      id: pmiTasks.id,
      task_code: pmiTasks.taskCode,
      title: pmiTasks.title,
      workstream_id: pmiTasks.workstreamId,
      workstream_name: pmiWorkstreams.name,
      assignee_id: pmiTasks.assigneeId,
      assignee_name: users.fullName,
      status: pmiTasks.status,
      priority: pmiTasks.priority,
      progress: pmiTasks.progress,
      due_date: pmiTasks.dueDate,
      notes: pmiTasks.notes,
      phase: pmiTasks.phase,
      meeting_id: pmiTasks.meetingId,
    })
    .from(pmiTasks)
    .leftJoin(pmiWorkstreams, eq(pmiTasks.workstreamId, pmiWorkstreams.id))
    .leftJoin(users, eq(pmiTasks.assigneeId, users.id));

  return Response.json(tasks);
}
