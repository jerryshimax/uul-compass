/**
 * Handoffs — Structured cross-functional requests
 *
 * Core primitive of the cross-border OS. A handoff is a request from
 * one person/department to another that carries context, an expected
 * action, and a status lifecycle.
 *
 * Every task that crosses functions should go through a handoff, not
 * an email or chat message. This ensures auditability and SLA tracking.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { users, entities, offices, departments } from "./org";
import { handoffStatusEnum, handoffUrgencyEnum } from "./enums";

export const handoffs = pgTable("handoffs", {
  id: uuid().defaultRandom().primaryKey(),

  // ─── Source ────────────────────────────────────────────────
  fromUserId: uuid("from_user_id").references(() => users.id).notNull(),
  fromOfficeId: uuid("from_office_id").references(() => offices.id),
  fromDepartmentId: uuid("from_department_id").references(() => departments.id),

  // ─── Destination ───────────────────────────────────────────
  // Either a specific user OR a department (if unassigned within dept,
  // any user with that department_id can pick it up).
  toUserId: uuid("to_user_id").references(() => users.id),
  toDepartmentCode: varchar("to_department_code", { length: 50 }),
  // Using department CODE (not FK) so the AI can route to "customer_service"
  // without needing to resolve UUIDs. Departments table keeps FK for humans.
  toOfficeId: uuid("to_office_id").references(() => offices.id),

  // ─── Content ───────────────────────────────────────────────
  subject: varchar({ length: 255 }).notNull(),
  context: text().notNull(), // background
  requestedAction: text("requested_action").notNull(), // specific ask

  urgency: handoffUrgencyEnum().default("medium").notNull(),
  dueBy: timestamp("due_by", { withTimezone: true }),

  // ─── Polymorphic link to a related entity ──────────────────
  relatedType: varchar("related_type", { length: 50 }),
  // "opportunity" | "demand_signal" | "task" | "risk" | "meeting" | etc.
  relatedId: uuid("related_id"),

  // ─── Lifecycle ─────────────────────────────────────────────
  status: handoffStatusEnum().default("sent").notNull(),
  seenAt: timestamp("seen_at", { withTimezone: true }),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  declinedAt: timestamp("declined_at", { withTimezone: true }),
  declineReason: text("decline_reason"),

  // ─── AI provenance ─────────────────────────────────────────
  draftedByAi: boolean("drafted_by_ai").default(false).notNull(),
  aiConversationId: uuid("ai_conversation_id"), // FK set loosely to avoid circular import

  // ─── Entity scoping ────────────────────────────────────────
  entityId: uuid("entity_id").references(() => entities.id).notNull(),

  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("handoffs_to_user_status_idx").on(t.toUserId, t.status),
  index("handoffs_from_user_idx").on(t.fromUserId, t.createdAt),
  index("handoffs_entity_idx").on(t.entityId, t.status),
  index("handoffs_department_idx").on(t.toDepartmentCode, t.status),
  index("handoffs_related_idx").on(t.relatedType, t.relatedId),
]);
