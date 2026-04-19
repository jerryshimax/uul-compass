/**
 * Projects — multi-phase, multi-year programs UUL serves.
 *
 * AIDC customers (the lead vertical) book programs, not transactional
 * shipments. Phase I of the hyperscale anchor case study runs 18 months
 * across 4 phases, anchored to MW commissioning milestones.
 *
 * v2 scope: phase-level only. Shipment-level data reads from Pallet via
 * read-integration; we do not duplicate it here. Power-ramp dashboard
 * displays "days slack to next MW milestone" using the milestone records
 * below + Pallet's shipment ETAs.
 *
 * Out of scope for v2 (deferred Phase 2): per-phase landed cost,
 * project_stakeholders, OS/OW permits, escort assignments, multi-axle
 * configs, DG attestations.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  bigint,
  integer,
  timestamp,
  date,
  index,
  jsonb,
  pgEnum,
  numeric,
} from "drizzle-orm/pg-core";
import { entities, users } from "./org";
import { customers } from "./customers";

// ─── Project status ────────────────────────────────────────────
export const projectStatusEnum = pgEnum("project_status", [
  "scoping",
  "active",
  "on_hold",
  "completed",
  "cancelled",
]);

// ─── Phase status (mirrors existing phaseStatusEnum but project-scoped) ─
export const projectPhaseStatusEnum = pgEnum("project_phase_status", [
  "not_started",
  "in_progress",
  "at_risk",
  "completed",
  "blocked",
]);

// ─── Milestone type ────────────────────────────────────────────
// MW commissioning is the master schedule for AIDC; everything else
// is for non-AIDC verticals (auto, govt, etc).
export const projectMilestoneTypeEnum = pgEnum("project_milestone_type", [
  "delivery",
  "mw_commissioning",
  "install_complete",
  "customs_clear",
  "phase_gate",
  "ready_for_install",
  "other",
]);

export const projectMilestoneStatusEnum = pgEnum("project_milestone_status", [
  "upcoming",
  "at_risk",
  "hit",
  "missed",
  "blown",
]);

// ─── Projects ──────────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: uuid().defaultRandom().primaryKey(),

  customerId: uuid("customer_id").references(() => customers.id).notNull(),

  // ─── Identity ──────────────────────────────────────────────
  name: varchar({ length: 255 }).notNull(),
  code: varchar({ length: 50 }), // internal short code, e.g. "AIDC-HS-1"

  description: text(),

  status: projectStatusEnum().default("scoping").notNull(),

  // ─── Scale (board context) ─────────────────────────────────
  // For AIDC: total power capacity. For others: leave null and use
  // metadata for vertical-specific scale (e.g., GWh for solar, units
  // for automotive).
  totalCapacityMw: numeric("total_capacity_mw", { precision: 10, scale: 2 }),
  totalAcres: integer("total_acres"),

  // ─── Timeline ──────────────────────────────────────────────
  startDate: date("start_date"),
  targetCompletionDate: date("target_completion_date"),
  actualCompletionDate: date("actual_completion_date"),

  // ─── Financial rollup (denormalized, refreshed by cron) ────
  totalContractCents: bigint("total_contract_cents", { mode: "number" }),
  recognizedRevenueCents: bigint("recognized_revenue_cents", { mode: "number" }),
  marginCents: bigint("margin_cents", { mode: "number" }),
  rollupRefreshedAt: timestamp("rollup_refreshed_at", { withTimezone: true }),

  // ─── Stakeholders (board view: just the UUL lead) ──────────
  leadOpsId: uuid("lead_ops_id").references(() => users.id),
  leadCommercialId: uuid("lead_commercial_id").references(() => users.id),
  // External stakeholders (EPC, OEM, owner's engineer) modeled in
  // Phase 2 — for v2 just describe in metadata.

  metadata: jsonb(),

  entityId: uuid("entity_id").references(() => entities.id).notNull(),

  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("projects_customer_idx").on(t.customerId, t.status),
  index("projects_status_idx").on(t.status, t.targetCompletionDate),
  index("projects_entity_idx").on(t.entityId, t.status),
]);

// ─── Project Phases ────────────────────────────────────────────
// e.g., "Phase I — 1,935 MW", "Phase II — 1,935 MW", etc.
export const projectPhases = pgTable("project_phases", {
  id: uuid().defaultRandom().primaryKey(),

  projectId: uuid("project_id").references(() => projects.id).notNull(),

  name: varchar({ length: 255 }).notNull(),
  sequence: integer().notNull(), // ordering: 1, 2, 3, 4

  description: text(),

  status: projectPhaseStatusEnum().default("not_started").notNull(),

  // Targets
  targetMw: numeric("target_mw", { precision: 10, scale: 2 }),
  // For AIDC: power capacity delivered in this phase.

  startDate: date("start_date"),
  targetCompletionDate: date("target_completion_date"),
  actualCompletionDate: date("actual_completion_date"),

  metadata: jsonb(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("project_phases_project_idx").on(t.projectId, t.sequence),
  index("project_phases_status_idx").on(t.status, t.targetCompletionDate),
]);

// ─── Project Milestones ────────────────────────────────────────
// MW commissioning ticks are the spine of the AIDC schedule. Other
// milestones (delivery cohorts, customs clears, phase gates) hang
// off the same table.
export const projectMilestones = pgTable("project_milestones", {
  id: uuid().defaultRandom().primaryKey(),

  projectId: uuid("project_id").references(() => projects.id).notNull(),
  phaseId: uuid("phase_id").references(() => projectPhases.id),

  name: varchar({ length: 255 }).notNull(),
  type: projectMilestoneTypeEnum().notNull(),

  // For mw_commissioning: target MW at this tick (e.g., 135, 675, 1215)
  targetMw: numeric("target_mw", { precision: 10, scale: 2 }),

  targetDate: date("target_date").notNull(),
  actualDate: date("actual_date"),

  status: projectMilestoneStatusEnum().default("upcoming").notNull(),

  // Days slack — calculated by cron from target_date - latest_shipment_eta
  // (shipment ETA pulled from Pallet for shipments tagged to this milestone)
  daysSlack: integer("days_slack"),

  notes: text(),
  metadata: jsonb(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("project_milestones_project_idx").on(t.projectId, t.targetDate),
  index("project_milestones_phase_idx").on(t.phaseId, t.targetDate),
  index("project_milestones_status_idx").on(t.status, t.targetDate),
  index("project_milestones_type_idx").on(t.type, t.status),
]);
