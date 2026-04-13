/**
 * Carrier Contracts — Service contracts with ocean/air/trucking carriers
 *
 * Per Jerry's call with Jason (2026-04-13): critical to track MQC
 * (Minimum Quantity Commitments) and utilization to trigger procurement
 * actions before peak season or when demand spikes.
 *
 * Procurement owns these records. Fulfillment team reads them to check
 * if a lane has contract coverage before committing to a customer.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  bigint,
  timestamp,
  index,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { users, entities, contacts } from "./org";
import {
  carrierContractStatusEnum,
  carrierTypeEnum,
  transportModeEnum,
} from "./enums";

export const carrierContracts = pgTable("carrier_contracts", {
  id: uuid().defaultRandom().primaryKey(),

  // ─── Carrier party ─────────────────────────────────────────
  carrierContactId: uuid("carrier_contact_id").references(() => contacts.id),
  carrierName: varchar("carrier_name", { length: 255 }).notNull(),
  // e.g., "MSC", "Maersk", "CMA CGM"
  carrierType: carrierTypeEnum("carrier_type").default("ocean").notNull(),

  // ─── Scope ─────────────────────────────────────────────────
  contractCode: varchar("contract_code", { length: 100 }), // carrier's SC number
  transportMode: transportModeEnum("transport_mode").default("ocean_fcl").notNull(),

  lane: varchar({ length: 255 }).notNull(), // "Shanghai-LA"
  originCity: varchar("origin_city", { length: 100 }),
  destinationCity: varchar("destination_city", { length: 100 }),

  commodityScope: text("commodity_scope"), // what commodities this SC covers

  // ─── Validity ──────────────────────────────────────────────
  validityStart: timestamp("validity_start", { withTimezone: true }).notNull(),
  validityEnd: timestamp("validity_end", { withTimezone: true }).notNull(),

  // ─── Commercial terms ──────────────────────────────────────
  baseRateCents: bigint("base_rate_cents", { mode: "number" }),
  // Base rate per TEU in cents (for 40HC typically)
  rateUnit: varchar("rate_unit", { length: 20 }).default("per_container"),

  mqcCommitted: integer("mqc_committed").notNull(),
  // Total TEU committed over contract lifetime
  mqcUtilized: integer("mqc_utilized").default(0).notNull(),
  // Running tally — updated as shipments dispatch against this contract

  peakSeasonTerms: text("peak_season_terms"),
  // Free-text for PSS, GRI, peak-season MQC additions

  bafGriTerms: jsonb("baf_gri_terms"),
  // Structured: { baf_included: bool, gri_cap_cents: number, etc. }

  // ─── Lifecycle ─────────────────────────────────────────────
  status: carrierContractStatusEnum().default("in_negotiation").notNull(),
  negotiationOwnerId: uuid("negotiation_owner_id").references(() => users.id),
  // Who in Procurement is driving this contract

  signedAt: timestamp("signed_at", { withTimezone: true }),

  // ─── Performance ───────────────────────────────────────────
  onTimePct: integer("on_time_pct"), // 0-100
  claimsCount: integer("claims_count").default(0).notNull(),

  notes: text(),
  metadata: jsonb(),

  entityId: uuid("entity_id").references(() => entities.id).notNull(),

  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("carrier_contracts_status_idx").on(t.status),
  index("carrier_contracts_lane_idx").on(t.lane, t.validityStart),
  index("carrier_contracts_entity_idx").on(t.entityId, t.status),
  index("carrier_contracts_carrier_idx").on(t.carrierName),
]);

// ─── Contract Utilization Events ──────────────────────────────
// Append-only log: every shipment booked against a contract records
// here. mqcUtilized on carrierContracts is computed from this.
export const contractUtilization = pgTable("contract_utilization", {
  id: uuid().defaultRandom().primaryKey(),
  contractId: uuid("contract_id").references(() => carrierContracts.id).notNull(),

  shipmentRef: varchar("shipment_ref", { length: 100 }),
  // Free-text shipment reference; when shipments schema exists, FK here.

  teuUsed: integer("teu_used").notNull(),
  bookedAt: timestamp("booked_at", { withTimezone: true }).defaultNow().notNull(),
  bookedByUserId: uuid("booked_by_user_id").references(() => users.id),

  notes: text(),

  // Reversible: if a shipment is cancelled, we set void=true instead of deleting
  voided: boolean().default(false).notNull(),
  voidedAt: timestamp("voided_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("contract_utilization_contract_idx").on(t.contractId, t.bookedAt),
]);
