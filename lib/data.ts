import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/types/database";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export interface ProductWithCategory extends ProductRow {
  category: Pick<CategoryRow, "id" | "slug" | "name_en" | "name_ta"> | null;
}

/**
 * All catalogue reads apply the same two rules as the DB CHECK/RLS layer,
 * explicitly, so the intent is legible here too: active status, and a
 * non-null price (FR-1.3 — price IS NULL is excluded from every listing).
 */
export async function getCatalogue(): Promise<ProductWithCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(id, slug, name_en, name_ta)")
    .eq("status", "active")
    .not("price", "is", null)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProductWithCategory[];
}

export async function getActiveCategories(): Promise<CategoryRow[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getCategoryWithCounts() {
  const [categories, products] = await Promise.all([getActiveCategories(), getCatalogue()]);
  const counts = new Map<string, number>();
  for (const p of products) {
    if (!p.category_id) continue;
    counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  }
  return categories.map((c) => ({ ...c, productCount: counts.get(c.id) ?? 0 }));
}

/**
 * Product detail may be opened directly even when the product would not
 * appear in a listing (§12.4: "such items are excluded from listings by
 * FR-1.3, but the URL may still be shared"). So this fetch does NOT filter
 * on price — the page itself renders the "unavailable" / "call for rate"
 * states.
 */
export async function getProductBySlug(slug: string): Promise<ProductWithCategory | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(id, slug, name_en, name_ta)")
    .eq("slug", slug)
    .neq("status", "archived")
    .maybeSingle();

  if (error) throw error;
  return data as ProductWithCategory | null;
}

export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 6,
): Promise<ProductWithCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(id, slug, name_en, name_ta)")
    .eq("category_id", categoryId)
    .eq("status", "active")
    .not("price", "is", null)
    .neq("id", excludeProductId)
    .order("display_order", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ProductWithCategory[];
}

export async function getBestsellers(limit = 12): Promise<ProductWithCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(id, slug, name_en, name_ta)")
    .eq("status", "active")
    .eq("is_bestseller", true)
    .not("price", "is", null)
    .order("display_order", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ProductWithCategory[];
}

export async function getFeatured(limit = 12): Promise<ProductWithCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(id, slug, name_en, name_ta)")
    .eq("status", "active")
    .eq("is_featured", true)
    .not("price", "is", null)
    .order("display_order", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ProductWithCategory[];
}

export interface Setting {
  key: string;
  value: unknown;
}

export async function getSetting<T = unknown>(key: string, fallback: T): Promise<T> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T) ?? fallback;
}

export async function getSettings(): Promise<Record<string, unknown>> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("settings").select("key, value");
  const map: Record<string, unknown> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}
