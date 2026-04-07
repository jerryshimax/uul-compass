import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const response = NextResponse.redirect(`${origin}/`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const email = data.user.email;
  if (!email) {
    return NextResponse.redirect(`${origin}/login?error=no_email`);
  }

  // Look up this email in our users table (method B — pre-created by admin)
  const [existing] = await db
    .select({ id: users.id, authId: users.authId })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!existing) {
    // Email not in our users table — not authorized
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=unauthorized`);
  }

  // Stamp authId on first login
  if (!existing.authId) {
    await db
      .update(users)
      .set({ authId: data.user.id })
      .where(eq(users.id, existing.id));
  }

  return response;
}
