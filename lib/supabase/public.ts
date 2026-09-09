import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Anon-key client for public catalogue reads, with NO cookie access.
 * Calling next/headers' cookies() — even just to read — forces a Next.js
 * route into fully dynamic rendering. The public catalogue has no session
 * concept at all (§23.2: /products, /product/[slug] etc. are ISR; /about
 * and friends are SSG), so those reads must never touch cookies.
 *
 * Use lib/supabase/server.ts only where a request's auth session actually
 * matters (there is no such place on the public site — only /admin).
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
