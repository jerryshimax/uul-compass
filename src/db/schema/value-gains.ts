import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { valueCategoryEnum, valueStatusEnum } from "./enums";
import { users } from "./org";
import { pmiWorkstreams } from "./pmi";
import { meetingNotes } from "./communication";

// ─── Value Initiatives (Profit Improvement Levers) ─────────────
export const valueInitiatives = pgTable("value_initiatives", {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  category: valueCategoryEnum().notNull(),
  description: text(),
  targetDescription: varchar("target_description", { length: 255 }), // e.g., "+3-5% revenue"
  plannedImpactCents: integer("planned_impact_cents").default(0), // USD cents
  capturedImpactCents: integer("captured_impact_cents").default(0),
  status: valueStatusEnum().default("planned").notNull(),
  ownerId: uuid("owner_id").references(() => users.id),
  workstreamId: uuid("workstream_id").references(() => pmiWorkstreams.id),
  progress: integer().default(0).notNull(), // 0-100 percentage
  meetingId: uuid("meeting_id").references(() => meetingNotes.id), // last meeting that touched this initiative (audit trail)
  measurementMethod: text("measurement_method"),
  startDate: date("start_date"),
  targetDate: date("target_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Value Snapshots (Monthly Progress) ────────────────────────
export const valueSnapshots = pgTable("value_snapshots", {
  id: uuid().defaultRandom().primaryKey(),
  initiativeId: uuid("initiative_id")
    .references(() => valueInitiatives.id)
    .notNull(),
  snapshotDate: date("snapshot_date").notNull(),
  runRateCents: integer("run_rate_cents").default(0),
  cumulativeCents: integer("cumulative_cents").default(0),
  notes: text(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
