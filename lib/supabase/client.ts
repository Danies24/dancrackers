"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/** Browser client — anon key only, respects RLS (§30.2). Never the service key here. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
