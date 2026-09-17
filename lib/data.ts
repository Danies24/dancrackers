import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/types/database";

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

/**
 * The generated type for the `public_products` VIEW marks every column
 * nullable — Postgres can't prove a view's output is NOT NULL the way it
 * can a table's, even though these columns are exactly as non-null in
 * practice as they are on the base `products` table (the view's WHERE and
 * its inner join to categories preserve that). Hand-corrected here rather
 * than trusting the overly-conservative generated shape.
 */
export interface ProductRow {
  id: string;
  sku: string;
  slug: string;
  name_en: string;
  name_ta: string | null;
  category_id: string;
  unit: string;
  status: string;
  is_bestseller: boolean;
  is_featured: boolean;
  min_qty: number;
  image_url: string | null;
  image_urls: string[];
  video_url: string | null;
  description: string | null;
  display_order: number;
  price: number | null;
  is_discountable: boolean;
  mrp: number | null;
  discount_percent: number | null;
}

export interface ProductWithCategory extends ProductRow {
  // The view builds this as a jsonb object directly (see the migration) —
  // never a PostgREST embed, since a plain view has no FK for PostgREST's
  // relationship detection to key off. Never null: every product has a
  // category (NOT NULL + inner join).
  category: Pick<CategoryRow, "id" | "slug" | "name_en" | "name_ta">;
}

/**
 * Every storefront read goes through `public_products` — never the base
 * `products` table — so a net-rate item's real supplier rate, or the
 * supplier-discount percentage, can never reach a customer-facing query
 * even by accident. The view still exposes every non-archived row; active-
 * only filtering (FR-1.3 — price IS NULL is excluded from listings) is
 * applied explicitly here, same as it always was against the base table.
 */
export async function getCatalogue(): Promise<ProductWithCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("public_products")
    .select("*")
    .eq("status", "active")
    .not("price", "is", null)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProductWithCategory[];
}

export async function getCategoryWithCounts() {
  const supabase = createPublicClient();
  const [{ data: categories, error }, products] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("display_order", { ascending: true }),
    getCatalogue(),
  ]);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const p of products) {
    if (!p.category_id) continue;
    counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  }
  return (categories ?? []).map((c) => ({ ...c, productCount: counts.get(c.id) ?? 0 }));
}

/**
 * A category marked active in the DB but with no orderable products in it
 * right now (catalogue turnover, a supplier gap) is worse than useless in a
 * customer-facing nav or filter — it's a dead end. Filtered out here, once,
 * so every caller (product filter pills, category nav, sitemap) gets it for
 * free instead of separately re-deriving product counts to hide the same
 * empty categories.
 */
export async function getActiveCategories(): Promise<CategoryRow[]> {
  const categories = await getCategoryWithCounts();
  return categories.filter((c) => c.productCount > 0);
}

/**
 * Product detail may be opened directly even when the product would not
 * appear in a listing (e.g. temporarily unavailable) — such items are
 * excluded from listings above, but the URL may still be shared, so this
 * fetch does NOT filter on status/price; the page itself renders the
 * "unavailable" / "ask for price" states. The view already excludes
 * archived (retired-catalogue) products entirely.
 */
export async function getProductBySlug(slug: string): Promise<ProductWithCategory | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("public_products")
    .select("*")
    .eq("slug", slug)
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
    .from("public_products")
    .select("*")
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
    .from("public_products")
    .select("*")
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
    .from("public_products")
    .select("*")
    .eq("status", "active")
    .eq("is_featured", true)
    .not("price", "is", null)
    .order("display_order", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ProductWithCategory[];
}

/**
 * The real, currently-active highest discount — feeds the honest headline
 * claim (brandConfig.getHeadlineOffer) so it can never overstate what's
 * actually on offer. 0 when nothing discountable is active.
 */
export async function getMaxActiveDiscountPercent(): Promise<number> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("public_products")
    .select("discount_percent")
    .eq("status", "active")
    .not("discount_percent", "is", null)
    .order("discount_percent", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return 0;
  return Number(data.discount_percent ?? 0);
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
