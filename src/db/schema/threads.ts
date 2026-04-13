/**
 * Threads — Conversations attached to any entity
 *
 * Any entity (task, risk, opportunity, handoff, decision, etc.) can have
 * a discussion thread. Participants can span departments and offices.
 *
 * Threads are the chat layer above structured data — used for clarifications,
 * negotiations, "I need more info" back-and-forth.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  index,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { users, entities } from "./org";

export const threads = pgTable("threads", {
  id: uuid().defaultRandom().primaryKey(),

  // ─── Polymorphic target ────────────────────────────────────
  targetType: varchar("target_type", { length: 50 }).notNull(),
  // "handoff" | "opportunity" | "demand_signal" | "task" | "risk" | "decision" | etc.
  targetId: uuid("target_id").notNull(),

  title: varchar({ length: 255 }), // optional human label

  // ─── Lifecycle ─────────────────────────────────────────────
  isResolved: boolean("is_resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: uuid("resolved_by").references(() => users.id),

  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow().notNull(),
  messageCount: integer("message_count").default(0).notNull(),

  entityId: uuid("entity_id").references(() => entities.id).notNull(),

  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("threads_target_idx").on(t.targetType, t.targetId),
  index("threads_entity_idx").on(t.entityId, t.lastMessageAt),
  unique("threads_target_unique").on(t.targetType, t.targetId),
  // One thread per target — if you need multiple, use the comments table
]);

export const threadParticipants = pgTable("thread_participants", {
  id: uuid().defaultRandom().primaryKey(),
  threadId: uuid("thread_id").references(() => threads.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),

  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  lastReadAt: timestamp("last_read_at", { withTimezone: true }),
  isMuted: boolean("is_muted").default(false).notNull(),
}, (t) => [
  unique("thread_participants_unique").on(t.threadId, t.userId),
  index("thread_participants_user_idx").on(t.userId),
]);

export const threadMessages = pgTable("thread_messages", {
  id: uuid().defaultRandom().primaryKey(),
  threadId: uuid("thread_id").references(() => threads.id).notNull(),
  authorId: uuid("author_id").references(() => users.id).notNull(),

  body: text().notNull(),
  mentionedUserIds: uuid("mentioned_user_ids").array(),

  // Reply threading (optional)
  parentMessageId: uuid("parent_message_id"),

  // AI provenance (if message was drafted by AI)
  draftedByAi: boolean("drafted_by_ai").default(false).notNull(),

  editedAt: timestamp("edited_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("thread_messages_thread_idx").on(t.threadId, t.createdAt),
  index("thread_messages_author_idx").on(t.authorId, t.createdAt),
]);
