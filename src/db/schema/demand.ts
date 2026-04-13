/**
 * Demand Signals — Forward-looking fulfillment signals
 *
 * A demand signal is a salesperson's input to the fulfillment team about
 * expected volume. Distinct from an opportunity: an opportunity tracks
 * the SALE, a demand signal tracks the OPERATIONAL NEED.
 *
 * Signals aggregate by lane × month for capacity planning. China hub
 * watches this feed to understand what's coming.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { users, entities } from "./org";
import { opportunities } from "./sales";
import { demandConfidenceEnum } from "./enums";

export const demandSignals = pgTable("demand_signals", {
  id: uuid().defaultRandom().primaryKey(),

  // ─── Origin salesperson ────────────────────────────────────
  salespersonId: uuid("salesperson_id").references(() => users.id).notNull(),

  // ─── Link to opportunity (if exists) ───────────────────────
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  // A signal may or may not have a parent opp — a salesperson can log raw
  // "expected volume" without a named deal yet.

  // ─── What ─────────────────────────────────────────────────
  customerName: varchar("customer_name", { length: 255 }),
  lane: varchar({ length: 255 }).notNull(),
  originCity: varchar("origin_city", { length: 100 }),
  destinationCity: varchar("destination_city", { length: 100 }),
  commodity: varchar({ length: 255 }),

  // ─── Volume & Timing ───────────────────────────────────────
  expectedVolumeTeu: integer("expected_volume_teu").notNull(),
  expectedStartDate: timestamp("expected_start_date", { withTimezone: true }).notNull(),
  expectedEndDate: timestamp("expected_end_date", { withTimezone: true }),

  recurrencePattern: varchar("recurrence_pattern", { length: 50 }),
  // "one_time" | "monthly" | "quarterly" — for recurring business

  confidence: demandConfidenceEnum().default("medium").notNull(),

  // ─── Handoff state ─────────────────────────────────────────
  // When this signal is picked up by the fulfillment team, track it
  assignedCsUserId: uuid("assigned_cs_user_id").references(() => users.id),
  assignedAt: timestamp("assigned_at", { withTimezone: true }),

  // Has this been converted to actual shipments?
  fulfilled: boolean().default(false).notNull(),
  fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),

  notes: text(),

  // ─── AI provenance ─────────────────────────────────────────
  createdByAi: boolean("created_by_ai").default(false).notNull(),
  aiConversationId: uuid("ai_conversation_id"),

  metadata: jsonb(),

  entityId: uuid("entity_id").references(() => entities.id).notNull(),

  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("demand_signals_lane_date_idx").on(t.lane, t.expectedStartDate),
  index("demand_signals_salesperson_idx").on(t.salespersonId, t.createdAt),
  index("demand_signals_assigned_idx").on(t.assignedCsUserId),
  index("demand_signals_entity_idx").on(t.entityId, t.expectedStartDate),
]);
