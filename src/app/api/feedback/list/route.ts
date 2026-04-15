import { NextResponse } from "next/server";
import { db } from "@/db";
import { userFeedback } from "@/db/schema/feedback";
import { users } from "@/db/schema/org";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: userFeedback.id,
      type: userFeedback.type,
      body: userFeedback.body,
      status: userFeedback.status,
      pageUrl: userFeedback.pageUrl,
      createdAt: userFeedback.createdAt,
      userName: users.fullName,
      userEmail: users.email,
    })
    .from(userFeedback)
    .innerJoin(users, eq(users.id, userFeedback.userId))
    .orderBy(userFeedback.createdAt);

  return NextResponse.json(rows);
}
