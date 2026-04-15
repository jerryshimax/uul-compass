import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Singleton pattern — prevents connection pool exhaustion during Next.js hot reloads.
// Without this, every module re-evaluation in dev creates a new postgres client.
declare global {
  // eslint-disable-next-line no-var
  var _pgClient: postgres.Sql | undefined;
}

// { prepare: false } is required for Supabase transaction pooler (PgBouncer)
const client = globalThis._pgClient ?? postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== "production") globalThis._pgClient = client;

export const db = drizzle(client, { schema });

export type Database = typeof db;
