import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** shop id -> display name, for labelling which shop an order was placed with in the admin. */
export async function getShopNamesById(): Promise<Record<string, string>> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("shops").select("id, name_en");
  return Object.fromEntries((data ?? []).map((s) => [s.id, s.name_en as string]));
}
