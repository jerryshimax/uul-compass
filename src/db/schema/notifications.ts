/**
 * Notifications — Inbox items
 *
 * Unified inbox for: handoffs received, mentions, watch alerts,
 * AI insights, system messages. Every notification has an action_url
 * the user can click to jump to the source.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { users, entities } from "./org";
import { notificationKindEnum } from "./enums";

export const notifications = pgTable("notifications", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),

  kind: notificationKindEnum().notNull(),

  // Polymorphic source — what triggered this notification
  sourceType: varchar("source_type", { length: 50 }),
  sourceId: uuid("source_id"),

  title: varchar({ length: 255 }).notNull(),
  body: text(),
  actionUrl: text("action_url"), // where to navigate when clicked

  metadata: jsonb(), // { actorId, oldValue, newValue, ... } — for rich rendering

  // Delivery channels
  deliveredInApp: timestamp("delivered_in_app", { withTimezone: true }).defaultNow().notNull(),
  deliveredPush: timestamp("delivered_push", { withTimezone: true }),
  deliveredEmail: timestamp("delivered_email", { withTimezone: true }),
  deliveredWechat: timestamp("delivered_wechat", { withTimezone: true }),

  // Read state
  readAt: timestamp("read_at", { withTimezone: true }),
  dismissedAt: timestamp("dismissed_at", { withTimezone: true }),

  entityId: uuid("entity_id").references(() => entities.id),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("notifications_user_unread_idx").on(t.userId, t.readAt),
  index("notifications_user_created_idx").on(t.userId, t.createdAt),
  index("notifications_source_idx").on(t.sourceType, t.sourceId),
]);
