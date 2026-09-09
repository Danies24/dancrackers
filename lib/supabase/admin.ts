import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role client. Bypasses RLS entirely — server-only, and the
 * `server-only` import makes an accidental client-bundle inclusion a build
 * error rather than a leaked secret (§30.2: "service key ... never in a
 * NEXT_PUBLIC_ variable").
 *
 * Use this in route handlers after validating input, never in a Server
 * Component that renders directly from user-controlled params.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
