/**
 * Watches — User subscriptions to entities
 *
 * A user can "watch" any entity (task, risk, opportunity, handoff, etc.)
 * to receive notifications when it changes. Supports different watch types:
 *   - any_change: notify on every modification
 *   - major_only: only status changes, assignee changes, stage moves
 *   - mentions_only: only when the user is mentioned
 *
 * The notifications table carries the resulting notification.
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { users, entities } from "./org";
import { watchTypeEnum } from "./enums";

export const watches = pgTable("watches", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),

  // Polymorphic target
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: uuid("target_id").notNull(),

  watchType: watchTypeEnum("watch_type").default("any_change").notNull(),

  // Scoping — watches live within an entity boundary
  entityId: uuid("entity_id").references(() => entities.id),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique("watches_unique").on(t.userId, t.targetType, t.targetId),
  index("watches_target_idx").on(t.targetType, t.targetId),
  index("watches_user_idx").on(t.userId),
]);
