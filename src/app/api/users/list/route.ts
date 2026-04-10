import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyBearerToken, unauthorizedResponse } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  if (!verifyBearerToken(request)) return unauthorizedResponse();

  const result = await db
    .select({
      id: users.id,
      full_name: users.fullName,
      full_name_zh: users.fullNameZh,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.isActive, true));

  return Response.json(result);
}
