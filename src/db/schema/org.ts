import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { userRoleEnum, contactTypeEnum, accessLevelEnum } from "./enums";

// ─── Entities (Sister Companies) ────────────────────────────────
export const entities = pgTable("entities", {
  id: uuid().defaultRandom().primaryKey(),
  code: varchar({ length: 20 }).unique().notNull(), // UUL, MH, XH, SAGE
  name: varchar({ length: 255 }).notNull(),
  nameZh: varchar("name_zh", { length: 255 }),
  legalName: varchar("legal_name", { length: 255 }),
  country: varchar({ length: 2 }),
  currency: varchar({ length: 3 }).default("USD"),
  isActive: boolean("is_active").default(true).notNull(),
  metadata: jsonb(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Offices ────────────────────────────────────────────────────
export const offices = pgTable("offices", {
  id: uuid().defaultRandom().primaryKey(),
  entityId: uuid("entity_id").references(() => entities.id).notNull(),
  name: varchar({ length: 255 }).notNull(),
  city: varchar({ length: 100 }),
  country: varchar({ length: 2 }),
  timezone: varchar({ length: 50 }),
  isHeadquarters: boolean("is_headquarters").default(false),
  address: text(),
  metadata: jsonb(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Departments ────────────────────────────────────────────────
export const departments = pgTable("departments", {
  id: uuid().defaultRandom().primaryKey(),
  entityId: uuid("entity_id").references(() => entities.id),
  name: varchar({ length: 100 }).notNull(),
  code: varchar({ length: 20 }).notNull(),
  color: varchar({ length: 20 }),
  // Lazy ref to break the departments <-> users circular dependency
  headId: uuid("head_id").references((): AnyPgColumn => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Users (Internal Team) ──────────────────────────────────────
export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  authId: uuid("auth_id").unique(), // auth.users.id — set on first login
  entityId: uuid("entity_id").references(() => entities.id),
  officeId: uuid("office_id").references(() => offices.id),
  departmentId: uuid("department_id").references(() => departments.id),
  email: varchar({ length: 255 }).unique().notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  fullNameZh: varchar("full_name_zh", { length: 255 }),
  title: varchar({ length: 255 }),
  phone: varchar({ length: 50 }),
  role: userRoleEnum().default("viewer").notNull(),
  reportsTo: uuid("reports_to").references((): AnyPgColumn => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  avatarUrl: text("avatar_url"),
  metadata: jsonb(), // WeChat, TG user ID, preferences
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Contacts (External People) ─────────────────────────────────
export const contacts = pgTable("contacts", {
  id: uuid().defaultRandom().primaryKey(),
  entityId: uuid("entity_id").references(() => entities.id),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  nameZh: varchar("name_zh", { length: 255 }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar({ length: 255 }),
  phone: varchar({ length: 50 }),
  company: varchar({ length: 255 }),
  title: varchar({ length: 255 }),
  contactType: contactTypeEnum("contact_type").default("other").notNull(),
  isPrimary: boolean("is_primary").default(false),
  tags: text().array(),
  notes: text(),
  relationshipOwnerId: uuid("relationship_owner_id").references(() => users.id),
  lastInteractionAt: timestamp("last_interaction_at", { withTimezone: true }),
  metadata: jsonb(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── User Entity Access (Multi-Entity Permissions) ──────────────
export const userEntityAccess = pgTable("user_entity_access", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  entityId: uuid("entity_id").references(() => entities.id).notNull(),
  accessLevel: accessLevelEnum("access_level").default("full").notNull(),
}, (t) => [
  unique().on(t.userId, t.entityId),
]);
