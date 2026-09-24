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

/** category_id -> group_id, across every shop — lets the home page tally cross-shop product counts per group without a join per product. */
export async function getCategoryGroupIdByCategoryId(): Promise<Map<string, string>> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("categories").select("id, group_id").not("group_id", "is", null);
  if (error) throw error;
  return new Map((data ?? []).map((c) => [c.id, c.group_id as string]));
}
