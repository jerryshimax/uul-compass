import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { pmiStatusEnum, taskStatusEnum, taskPriorityEnum } from "./enums";
import { users, departments } from "./org";
import { meetingNotes } from "./communication";

// ─── PMI Workstreams ────────────────────────────────────────────
export const pmiWorkstreams = pgTable("pmi_workstreams", {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  color: varchar({ length: 20 }),
  departmentId: uuid("department_id").references(() => departments.id),
  ownerId: uuid("owner_id").references(() => users.id),
  targetCompletion: integer("target_completion").default(0), // expected % done by current day
  sortOrder: integer("sort_order").default(0),
  status: pmiStatusEnum().default("not_started").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── PMI Milestones ─────────────────────────────────────────────
export const pmiMilestones = pgTable("pmi_milestones", {
  id: uuid().defaultRandom().primaryKey(),
  workstreamId: uuid("workstream_id")
    .references(() => pmiWorkstreams.id)
    .notNull(),
  code: varchar({ length: 20 }),          // e.g. "F-M1", "O-M2"
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  phase: integer().default(1).notNull(),   // 1, 2, or 3
  targetDate: date("target_date"),
  completedDate: date("completed_date"),
  status: pmiStatusEnum().default("not_started").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── PMI Tasks ──────────────────────────────────────────────────
export const pmiTasks = pgTable("pmi_tasks", {
  id: uuid().defaultRandom().primaryKey(),
  workstreamId: uuid("workstream_id")
    .references(() => pmiWorkstreams.id)
    .notNull(),
  milestoneId: uuid("milestone_id").references(() => pmiMilestones.id),
  taskCode: varchar("task_code", { length: 10 }),  // e.g. "F1", "O12", "T9"
  phase: integer().default(1).notNull(),            // 1, 2, or 3
  isCrossOffice: boolean("is_cross_office").default(false).notNull(),
  title: varchar({ length: 500 }).notNull(),
  description: text(),
  assigneeId: uuid("assignee_id").references(() => users.id),
  reporterId: uuid("reporter_id").references(() => users.id),
  status: taskStatusEnum().default("todo").notNull(),
  priority: taskPriorityEnum().default("medium").notNull(),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  progress: integer().default(0).notNull(), // 0-100 percentage
  notes: text(), // latest update note from meetings
  meetingId: uuid("meeting_id").references(() => meetingNotes.id), // last meeting that touched this task (audit trail)
  tags: text().array(),
  sortOrder: integer("sort_order").default(0),
  metadata: jsonb(), // SOP references, tribal knowledge notes, etc.
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
