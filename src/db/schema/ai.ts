import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  bigint,
} from "drizzle-orm/pg-core";
import { users, entities } from "./org";
import {
  aiMessageRoleEnum,
  aiToolStatusEnum,
  aiModelEnum,
} from "./enums";

// ─── Conversations ─────────────────────────────────────────────
// Each conversation is a chat session for one user. Conversations
// are entity-scoped so they can only contain context from entities
// the user has access to.
export const aiConversations = pgTable("ai_conversations", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  entityId: uuid("entity_id").references(() => entities.id),

  title: varchar({ length: 255 }), // first user message truncated, or AI-generated
  pageContext: jsonb("page_context"), // { route, visibleEntities[] } at conversation start

  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow().notNull(),
  messageCount: integer("message_count").default(0).notNull(),
  totalCostCents: integer("total_cost_cents").default(0).notNull(),

  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("ai_conversations_user_idx").on(t.userId, t.lastMessageAt),
  index("ai_conversations_entity_idx").on(t.entityId),
]);

// ─── Messages ──────────────────────────────────────────────────
// Every message in a conversation. Includes user, assistant, system,
// and tool messages. Token counts and cost recorded per message for
// per-user spend tracking.
export const aiMessages = pgTable("ai_messages", {
  id: uuid().defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => aiConversations.id).notNull(),

  role: aiMessageRoleEnum().notNull(),
  content: text(), // null for tool_calls, populated for text content
  toolCalls: jsonb("tool_calls"), // [{ id, name, args }] when assistant calls tools
  toolResults: jsonb("tool_results"), // [{ callId, result }] when role=tool
  citations: jsonb(), // [{ type: "brain"|"db", id, label, url? }]

  model: aiModelEnum(),
  tokensIn: integer("tokens_in").default(0).notNull(),
  tokensOut: integer("tokens_out").default(0).notNull(),
  tokensCached: integer("tokens_cached").default(0).notNull(), // cached input tokens (90% discount)
  costCents: integer("cost_cents").default(0).notNull(),
  latencyMs: integer("latency_ms"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("ai_messages_conversation_idx").on(t.conversationId, t.createdAt),
]);

// ─── Tool Calls (audit trail) ──────────────────────────────────
// Every AI tool invocation logged separately for audit/replay.
// Status tracks user confirmation flow: pending → confirmed/rejected → executed/failed.
export const aiToolCalls = pgTable("ai_tool_calls", {
  id: uuid().defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => aiConversations.id).notNull(),
  messageId: uuid("message_id").references(() => aiMessages.id),
  userId: uuid("user_id").references(() => users.id).notNull(),

  toolName: varchar("tool_name", { length: 100 }).notNull(),
  args: jsonb().notNull(),
  argsEdited: jsonb("args_edited"), // populated if user edited before confirming
  status: aiToolStatusEnum().default("pending").notNull(),
  result: jsonb(),
  error: text(),

  // For write tools, track the entity created/updated
  affectedEntityType: varchar("affected_entity_type", { length: 50 }),
  affectedEntityId: uuid("affected_entity_id"),

  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("ai_tool_calls_user_idx").on(t.userId, t.createdAt),
  index("ai_tool_calls_status_idx").on(t.status),
]);

// ─── Daily Usage Roll-up ───────────────────────────────────────
// Aggregated per-user daily stats for cost dashboards. Updated by
// a trigger or job on every ai_message insert.
export const aiUsage = pgTable("ai_usage", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  date: varchar({ length: 10 }).notNull(), // YYYY-MM-DD

  messageCount: integer("message_count").default(0).notNull(),
  toolCallCount: integer("tool_call_count").default(0).notNull(),
  tokensIn: bigint("tokens_in", { mode: "number" }).default(0).notNull(),
  tokensOut: bigint("tokens_out", { mode: "number" }).default(0).notNull(),
  tokensCached: bigint("tokens_cached", { mode: "number" }).default(0).notNull(),
  costCents: integer("cost_cents").default(0).notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("ai_usage_user_date_idx").on(t.userId, t.date),
]);

// ─── Embeddings (pgvector) ─────────────────────────────────────
// Vector store for RAG. Polymorphic: any entity (brain file, meeting,
// task, decision, etc.) can have embeddings. Filtered by entity_id
// at query time so users only retrieve from their accessible entities.
//
// NOTE: The actual `embedding vector(1536)` column is added via raw SQL
// migration since drizzle-orm doesn't have native pgvector support.
// See: drizzle/0002_pgvector.sql
export const aiEmbeddings = pgTable("ai_embeddings", {
  id: uuid().defaultRandom().primaryKey(),
  entityId: uuid("entity_id").references(() => entities.id),

  sourceType: varchar("source_type", { length: 50 }).notNull(),
  // "brain_file" | "meeting_note" | "pmi_task" | "risk" | "decision" | "opportunity" | etc.
  sourceId: varchar("source_id", { length: 255 }).notNull(),
  // Brain files: file path. DB entities: UUID.

  chunkIndex: integer("chunk_index").default(0).notNull(),
  // For long content, store multiple embeddings per source

  text: text().notNull(), // the actual chunk text that was embedded
  metadata: jsonb(), // { title, path, last_modified_at, source_url, ... }

  embeddingModel: varchar("embedding_model", { length: 100 }).default("text-embedding-3-small").notNull(),
  // embedding column added via raw SQL migration: vector(1536)

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("ai_embeddings_source_idx").on(t.sourceType, t.sourceId),
  index("ai_embeddings_entity_idx").on(t.entityId),
]);

// ─── AI Insights (proactive cards) ─────────────────────────────
// AI-generated insights pushed to users' inboxes. Generated by
// scheduled jobs or in response to data patterns.
export const aiInsights = pgTable("ai_insights", {
  id: uuid().defaultRandom().primaryKey(),
  scopeType: varchar("scope_type", { length: 20 }).notNull(), // "user" | "office" | "entity" | "global"
  scopeId: uuid("scope_id"), // user_id or entity_id depending on scope_type

  kind: varchar({ length: 50 }).notNull(), // "alert" | "trend" | "suggestion" | "anomaly"
  severity: varchar({ length: 20 }).default("info").notNull(), // "info" | "warning" | "critical"

  title: varchar({ length: 255 }).notNull(),
  body: text().notNull(),
  evidence: jsonb(), // [{ type, id, label }] supporting links
  suggestedAction: text("suggested_action"),
  actionUrl: text("action_url"),

  generatedByModel: aiModelEnum("generated_by_model"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),

  acknowledgedBy: uuid("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),

  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("ai_insights_scope_idx").on(t.scopeType, t.scopeId),
  index("ai_insights_unack_idx").on(t.acknowledgedAt),
]);

// ─── Briefs (daily / weekly digests) ───────────────────────────
// AI-generated digests for users, offices, or executives.
// Cron-generated at 6am local time.
export const aiBriefs = pgTable("ai_briefs", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  entityId: uuid("entity_id").references(() => entities.id),

  kind: varchar({ length: 50 }).notNull(),
  // "daily_personal" | "daily_office" | "weekly_exec" | "weekly_function"

  scopeKey: varchar("scope_key", { length: 100 }), // e.g., "office:houston" or "function:sales"

  title: varchar({ length: 255 }).notNull(),
  body: text().notNull(),
  highlights: jsonb(), // [{ kind, text, link }] for one-line bullets

  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  forDate: varchar("for_date", { length: 10 }).notNull(), // YYYY-MM-DD

  readAt: timestamp("read_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("ai_briefs_user_date_idx").on(t.userId, t.forDate),
  index("ai_briefs_entity_date_idx").on(t.entityId, t.forDate),
]);
