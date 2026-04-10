import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { meetingNotes } from "./communication";
import { riskSeverityEnum, riskStatusEnum } from "./enums";
import { users } from "./org";
import { pmiWorkstreams } from "./pmi";

// ─── Risks ─────────────────────────────────────────────────────
export const risks = pgTable("risks", {
  id: uuid().defaultRandom().primaryKey(),
  title: varchar({ length: 500 }).notNull(),
  description: text(),
  severity: riskSeverityEnum().default("medium").notNull(),
  status: riskStatusEnum().default("open").notNull(),
  mitigationPlan: text("mitigation_plan"),
  ownerId: uuid("owner_id").references(() => users.id),
  workstreamId: uuid("workstream_id").references(() => pmiWorkstreams.id),
  // Stored as task codes (e.g. ["F1","O2"]) — resolved to UUIDs at query time
  linkedTaskCodes: text("linked_task_codes").array(),
  notes: text(), // latest update note from meetings
  meetingId: uuid("meeting_id").references(() => meetingNotes.id), // last meeting that touched this risk (audit trail)
  raisedDate: date("raised_date"),
  targetDate: date("target_date"),
  resolvedDate: date("resolved_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
