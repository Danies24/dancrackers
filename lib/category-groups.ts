import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/types/database";

export type CategoryGroupRow = Database["public"]["Tables"]["category_groups"]["Row"];

/** The home page's "Shop by category" strip (multi-shop spec §5.2) — the featured subset only. */
export async function getFeaturedCategoryGroups(): Promise<CategoryGroupRow[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("category_groups")
    .select("*")
    .eq("is_featured", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Every category group, featured or not — feeds the category page's switcher row. */
export async function getAllCategoryGroups(): Promise<CategoryGroupRow[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("category_groups").select("*").order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
