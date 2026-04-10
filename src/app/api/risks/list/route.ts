import { NextRequest } from "next/server";
import { db } from "@/db";
import { risks, pmiWorkstreams, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyBearerToken, unauthorizedResponse } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  if (!verifyBearerToken(request)) return unauthorizedResponse();

  const result = await db
    .select({
      id: risks.id,
      title: risks.title,
      description: risks.description,
      severity: risks.severity,
      status: risks.status,
      mitigation_plan: risks.mitigationPlan,
      owner_id: risks.ownerId,
      owner_name: users.fullName,
      workstream_id: risks.workstreamId,
      workstream_name: pmiWorkstreams.name,
      linked_task_codes: risks.linkedTaskCodes,
      notes: risks.notes,
      raised_date: risks.raisedDate,
      target_date: risks.targetDate,
      meeting_id: risks.meetingId,
    })
    .from(risks)
    .leftJoin(users, eq(risks.ownerId, users.id))
    .leftJoin(pmiWorkstreams, eq(risks.workstreamId, pmiWorkstreams.id));

  return Response.json(result);
}
