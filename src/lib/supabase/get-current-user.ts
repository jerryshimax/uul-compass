import { createClient } from "./server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export type CurrentUser = {
  id: string;          // our internal users.id (used in all FK references)
  authId: string;      // auth.users.id
  email: string;
  fullName: string;
  role: string;
};

/**
 * Returns the current authenticated user from our users table.
 * Returns null if not authenticated or not in our users table.
 * Use in Server Components and Server Actions.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const [row] = await db
    .select({
      id: users.id,
      authId: users.authId,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
    })
    .from(users)
    .where(eq(users.authId, user.id))
    .limit(1);

  if (!row || !row.authId) return null;

  return {
    id: row.id,
    authId: row.authId,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
  };
}

/**
 * Role check helpers — use in Server Actions before any write.
 * "admin" roles can edit everything; others can only edit their own items.
 */
const ADMIN_ROLES = new Set(["owner", "board"]);

export function isAdmin(role: string): boolean {
  return ADMIN_ROLES.has(role);
}
