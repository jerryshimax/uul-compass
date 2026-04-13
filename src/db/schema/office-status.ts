/**
 * Office Status — Live "what we're working on" per office
 *
 * One row per office. Updated by office leads (or by AI summarizing
 * the last 24h of activity). Feeds the Offices view and powers the
 * capacity indicator (green/yellow/red).
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { users, offices } from "./org";

export const officeStatus = pgTable("office_status", {
  id: uuid().defaultRandom().primaryKey(),
  officeId: uuid("office_id").references(() => offices.id).notNull(),

  currentFocus: text("current_focus"),
  // Free-text: "Driving ACME pricing, closing Q3 forecasts"

  capacityIndicator: varchar("capacity_indicator", { length: 10 }).default("green"),
  // "green" | "yellow" | "red"

  blockers: text(),

  setByUserId: uuid("set_by_user_id").references(() => users.id),
  setAt: timestamp("set_at", { withTimezone: true }).defaultNow().notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique("office_status_unique").on(t.officeId),
]);
