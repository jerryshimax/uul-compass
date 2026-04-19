/**
 * Customers — the companies UUL serves.
 *
 * Board-grade view: name, public brand, vertical, primary contact, status,
 * revenue rollup, last touch. Detailed CRM (contacts junction, SOPs, credit
 * terms) lives in Phase 2; v2 ships the strategic context layer only.
 *
 * Note: opportunities.customerName is currently denormalized — once a
 * customer record exists, opportunities.customerId can be backfilled.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  bigint,
  timestamp,
  index,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { entities, users } from "./org";
import { industryEnum, customerStatusEnum } from "./enums";

export const customers = pgTable("customers", {
  id: uuid().defaultRandom().primaryKey(),

  // ─── Identity ──────────────────────────────────────────────
  name: varchar({ length: 255 }).notNull(),
  legalName: varchar("legal_name", { length: 255 }),

  // Which UUL public brand serves this customer (UUL Global Warehousing,
  // Sage Line Logistics, All Points Customs). Drives customer-facing
  // artifact headers (quotes, invoices, status reports).
  publicBrand: varchar("public_brand", { length: 50 }),

  vertical: industryEnum(),
  status: customerStatusEnum().default("prospect").notNull(),

  // ─── Strategic context ─────────────────────────────────────
  // Free-text notes for board-level context: relationship history,
  // strategic value, who-knows-who. Detailed CRM moves to a contacts
  // junction in Phase 2.
  strategicNotes: text("strategic_notes"),

  // ─── Ownership ─────────────────────────────────────────────
  accountOwnerId: uuid("account_owner_id").references(() => users.id),
  // The UUL person who owns the relationship.

  // ─── Rollups (denormalized for board view; refreshed by cron) ─
  revenueYtdCents: bigint("revenue_ytd_cents", { mode: "number" }),
  revenueLtmCents: bigint("revenue_ltm_cents", { mode: "number" }),
  openArCents: bigint("open_ar_cents", { mode: "number" }),
  marginYtdCents: bigint("margin_ytd_cents", { mode: "number" }),

  lastTouchAt: timestamp("last_touch_at", { withTimezone: true }),
  rollupRefreshedAt: timestamp("rollup_refreshed_at", { withTimezone: true }),

  // ─── Flags ─────────────────────────────────────────────────
  isStrategic: boolean("is_strategic").default(false).notNull(),
  // Board-watched accounts; surfaced on the Board dashboard.

  // ─── Context blob ──────────────────────────────────────────
  metadata: jsonb(),

  entityId: uuid("entity_id").references(() => entities.id).notNull(),

  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("customers_status_idx").on(t.status, t.vertical),
  index("customers_entity_idx").on(t.entityId, t.status),
  index("customers_owner_idx").on(t.accountOwnerId, t.status),
  index("customers_strategic_idx").on(t.isStrategic, t.status),
  index("customers_name_idx").on(t.name),
]);
