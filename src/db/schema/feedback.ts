/**
 * User Feedback — In-app bug reports, ideas, questions
 *
 * Users click the feedback button (bottom-left on every page) to report
 * issues. Jerry/David triage via /admin/feedback.
 *
 * Critical during the 10-user soft launch — this is how we learn what's
 * broken and what to build next.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./org";
import { feedbackTypeEnum, feedbackStatusEnum } from "./enums";

export const userFeedback = pgTable("user_feedback", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),

  type: feedbackTypeEnum().notNull(),
  body: text().notNull(),

  // Context at time of submission
  pageUrl: text("page_url"),
  userAgent: text("user_agent"),
  screenshotUrl: text("screenshot_url"),
  pageContext: jsonb("page_context"), // { visibleEntities, filters, etc. }

  // Triage
  status: feedbackStatusEnum().default("open").notNull(),
  triagedBy: uuid("triaged_by").references(() => users.id),
  triagedAt: timestamp("triaged_at", { withTimezone: true }),
  adminNotes: text("admin_notes"),

  // Outcome
  resolutionNotes: text("resolution_notes"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  relatedIssueUrl: text("related_issue_url"), // GitHub issue link

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("feedback_status_idx").on(t.status, t.createdAt),
  index("feedback_user_idx").on(t.userId, t.createdAt),
  index("feedback_type_idx").on(t.type, t.status),
]);
