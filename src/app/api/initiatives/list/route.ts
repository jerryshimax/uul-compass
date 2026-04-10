import { NextRequest } from "next/server";
import { db } from "@/db";
import { valueInitiatives, pmiWorkstreams, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyBearerToken, unauthorizedResponse } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  if (!verifyBearerToken(request)) return unauthorizedResponse();

  const result = await db
    .select({
      id: valueInitiatives.id,
      name: valueInitiatives.name,
      category: valueInitiatives.category,
      description: valueInitiatives.description,
      status: valueInitiatives.status,
      progress: valueInitiatives.progress,
      planned_impact_cents: valueInitiatives.plannedImpactCents,
      captured_impact_cents: valueInitiatives.capturedImpactCents,
      owner_id: valueInitiatives.ownerId,
      owner_name: users.fullName,
      workstream_id: valueInitiatives.workstreamId,
      workstream_name: pmiWorkstreams.name,
      target_date: valueInitiatives.targetDate,
      meeting_id: valueInitiatives.meetingId,
    })
    .from(valueInitiatives)
    .leftJoin(users, eq(valueInitiatives.ownerId, users.id))
    .leftJoin(pmiWorkstreams, eq(valueInitiatives.workstreamId, pmiWorkstreams.id));

  return Response.json(result);
}
