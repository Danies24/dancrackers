import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Server client for use in Server Components / Route Handlers that need the
 * signed-in admin's session (RLS applies). For admin data mutations, prefer
 * the service-role client in lib/supabase/admin.ts, called only after
 * verifying the session server-side (§30.2 — never a client-side redirect alone).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
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
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component render — middleware refreshes the
            // session instead. Safe to ignore (Supabase SSR guidance).
          }
        },
      },
    },
  );
}
