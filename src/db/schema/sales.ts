/**
 * Sales Pipeline — Opportunities and their activity
 *
 * An opportunity is a potential deal a salesperson is pursuing. It moves
 * through stages (lead → qualified → quoted → negotiating → won/lost).
 *
 * Sales reps enter opportunities via natural language through the AI chat.
 * AI extracts structured fields (customer, lane, volume, value) and asks
 * for confirmation before creating the record.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  bigint,
  integer,
  timestamp,
  index,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { users, entities, contacts } from "./org";
import { opportunityStageEnum } from "./enums";

export const opportunities = pgTable("opportunities", {
  id: uuid().defaultRandom().primaryKey(),

  // ─── Customer / counterparty ───────────────────────────────
  customerContactId: uuid("customer_contact_id").references(() => contacts.id),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  // Denormalized so AI doesn't need to resolve a contact for every create

  description: text(),

  // ─── Sales team ────────────────────────────────────────────
  salespersonId: uuid("salesperson_id").references(() => users.id).notNull(),
  supportingUserIds: uuid("supporting_user_ids").array(), // CS, pricing, etc.

  // ─── Pipeline stage ────────────────────────────────────────
  stage: opportunityStageEnum().default("lead").notNull(),
  stageChangedAt: timestamp("stage_changed_at", { withTimezone: true }).defaultNow().notNull(),

  // ─── Deal economics ────────────────────────────────────────
  expectedValueCents: bigint("expected_value_cents", { mode: "number" }),
  expectedMarginCents: bigint("expected_margin_cents", { mode: "number" }),
  wonValueCents: bigint("won_value_cents", { mode: "number" }),

  currency: varchar({ length: 3 }).default("USD").notNull(),

  // ─── Shipping context ──────────────────────────────────────
  lane: varchar({ length: 255 }), // e.g., "Shanghai-LA"
  originCity: varchar("origin_city", { length: 100 }),
  destinationCity: varchar("destination_city", { length: 100 }),
  commodity: varchar({ length: 255 }),
  volumeTeu: integer("volume_teu"),
  volumeTeuMonthly: integer("volume_teu_monthly"),
  // If this opp is recurring business, track monthly volume separately

  incoterm: varchar({ length: 10 }), // FOB, CIF, DDP, etc.

  // ─── Timeline ──────────────────────────────────────────────
  expectedCloseDate: timestamp("expected_close_date", { withTimezone: true }),
  expectedStartDate: timestamp("expected_start_date", { withTimezone: true }),
  // When the business actually begins

  // ─── AI provenance ─────────────────────────────────────────
  createdByAi: boolean("created_by_ai").default(false).notNull(),
  aiConversationId: uuid("ai_conversation_id"),

  // ─── Context blob ──────────────────────────────────────────
  metadata: jsonb(), // competitor info, customer preferences, notes

  entityId: uuid("entity_id").references(() => entities.id).notNull(),

  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("opportunities_salesperson_stage_idx").on(t.salespersonId, t.stage),
  index("opportunities_stage_idx").on(t.stage, t.expectedCloseDate),
  index("opportunities_entity_idx").on(t.entityId, t.stage),
  index("opportunities_customer_idx").on(t.customerName),
]);

// ─── Touchpoints (calls, emails, meetings tied to an opp) ─────
export const opportunityActivities = pgTable("opportunity_activities", {
  id: uuid().defaultRandom().primaryKey(),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),

  kind: varchar({ length: 50 }).notNull(),
  // "call" | "email" | "meeting" | "quote_sent" | "note" | "stage_change"

  title: varchar({ length: 255 }),
  body: text(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),

  metadata: jsonb(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("opp_activities_opp_idx").on(t.opportunityId, t.occurredAt),
]);
