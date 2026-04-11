import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient({ rememberMe = true }: { rememberMe?: boolean } = {}) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = rememberMe
                ? options
                : { ...options, maxAge: undefined, expires: undefined };
              cookieStore.set(name, value, cookieOptions);
            });
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
