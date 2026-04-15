import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { db } from "@/db";
import { userFeedback } from "@/db/schema/feedback";
import { users } from "@/db/schema/org";
import { eq, desc } from "drizzle-orm";
import { AdminContent, type FeedbackRow } from "./admin-content";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.isAdmin) redirect("/");

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
    .orderBy(desc(userFeedback.createdAt));

  const serialized: FeedbackRow[] = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return <AdminContent initialRows={serialized} />;
}
