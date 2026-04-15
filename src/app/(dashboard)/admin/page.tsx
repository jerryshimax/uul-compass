import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { db } from "@/db";
import { userFeedback } from "@/db/schema/feedback";
import { aiUsage } from "@/db/schema/ai";
import { users } from "@/db/schema/org";
import { eq, desc } from "drizzle-orm";
import { AdminContent, type FeedbackRow, type AiUsageRow } from "./admin-content";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.isAdmin) redirect("/");

  const [feedbackData, usageData] = await Promise.all([
    db
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
      .orderBy(desc(userFeedback.createdAt)),

    db
      .select({
        id: aiUsage.id,
        model: aiUsage.model,
        inputTokens: aiUsage.inputTokens,
        outputTokens: aiUsage.outputTokens,
        cacheReadTokens: aiUsage.cacheReadTokens,
        cacheWriteTokens: aiUsage.cacheWriteTokens,
        createdAt: aiUsage.createdAt,
        userName: users.fullName,
      })
      .from(aiUsage)
      .innerJoin(users, eq(users.id, aiUsage.userId))
      .orderBy(desc(aiUsage.createdAt)),
  ]);

  const feedbackRows: FeedbackRow[] = feedbackData.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  const aiUsageRows: AiUsageRow[] = usageData.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return <AdminContent feedbackRows={feedbackRows} aiUsageRows={aiUsageRows} />;
}
