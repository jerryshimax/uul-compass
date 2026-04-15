import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { chatRoleEnum, chatStatusEnum, draftStatusEnum } from "./enums";
import { users } from "./org";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid().defaultRandom().primaryKey(),
    title: varchar({ length: 500 }),
    pageContext: jsonb("page_context"), // { route, entityType, entityId, entityName }
    status: chatStatusEnum().default("active").notNull(),
    messageCount: integer("message_count").default(0),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_conversations_status").on(table.status),
    index("idx_conversations_last_msg").on(table.lastMessageAt),
  ]
);

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
    model: varchar({ length: 50 }).notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_ai_usage_user").on(table.userId),
    index("idx_ai_usage_created").on(table.createdAt),
  ]
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid().defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull(),
    role: chatRoleEnum().notNull(),
    content: text(),
    toolName: varchar("tool_name", { length: 100 }),
    toolInput: jsonb("tool_input"),
    toolOutput: jsonb("tool_output"),
    draftPayload: jsonb("draft_payload"),
    draftStatus: draftStatusEnum("draft_status"),
    tokenCount: integer("token_count"),
    model: varchar({ length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_chat_messages_conv").on(table.conversationId),
    index("idx_chat_messages_conv_created").on(
      table.conversationId,
      table.createdAt
    ),
  ]
);
