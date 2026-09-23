import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { rankProducts } from "@/lib/ranking";
import { getComboVarietyBySlug, type ComboVarietyDetail } from "@/lib/combo-packs";
import type { Database } from "@/types/database";

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

/**
 * Every function below predates the multi-shop schema and reads/writes no
 * `shop_id` at all — which used to be fine when Sri Ram was the only shop
 * with any data. Now that Bullet (and eventually Gurusamy) share the same
 * `products`/`categories` tables, an unscoped query here would silently
 * surface another shop's catalogue on these routes (`/`, `/products`,
 * `/products/[category]`, `/product/[slug]`) that don't yet know shops
 * exist. Until those routes are rebuilt as shop-aware (multi-shop spec
 * §5.1/§5.5), every one of them is pinned to Sri Ram's shop_id — this is
 * exactly a no-op for Sri Ram today (100% of currently-active data is
 * already Sri Ram's) and is what keeps these old routes "byte-identical"
 * while actually excluding other shops, rather than relying on flipping
 * another shop's product/category status as a stand-in for real scoping.
 */
export const getSriRamShopId = cache(async (): Promise<string> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("shops").select("id").eq("slug", "sri-ram-crackers").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Shop not found: sri-ram-crackers");
  return data.id;
});

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
  shop_id: string;
  shop_slug: string;
  /** e.g. "10 Pcs" — set on shops using net_markup pricing (multi-shop spec §2.1); null for Sri Ram. */
  pack: string | null;
  unit: string;
  status: string;
  is_bestseller: boolean;
  is_featured: boolean;
  is_best?: boolean;
  /**
   * Swiggy-redesign merchandising flags (supabase/migrations/20260924000001)
   * — optional until that migration is applied to production and
   * `npm run db:types` regenerated: undefined behaves as "not flagged"
   * everywhere these are read, so the app keeps working against the old
   * schema in the meantime.
   */
  is_top_pick?: boolean;
  is_recommended?: boolean;
  noise_type?: "sound" | "no_sound" | null;
  kids_safe?: boolean;
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
  // category (NOT NULL + inner join). For a combo pack variety (see
  // `combo` below) this is a synthetic placeholder — the product page skips
  // the category chip entirely whenever `combo` is set.
  category: Pick<CategoryRow, "id" | "slug" | "name_en" | "name_ta">;
  // Set only when this "product" is actually a combo pack variety resolved
  // by getProductBySlug()'s fallback (see combo-packs.ts) — everything
  // above is a synthetic shape (price = the variety's computed total, no
  // real mrp/discount) so the page's existing price block renders it
  // correctly with zero changes; the page branches on this field only to
  // swap the description section for "what's inside" and show the tier
  // switcher.
  combo?: ComboVarietyDetail;
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
    .eq("shop_id", await getSriRamShopId())
    .eq("status", "active")
    .not("price", "is", null)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return rankProducts((data ?? []) as unknown as ProductWithCategory[]);
}

export async function getCategoryWithCounts() {
  const supabase = createPublicClient();
  const [{ data: categories, error }, products] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("shop_id", await getSriRamShopId())
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
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
    .eq("shop_id", await getSriRamShopId())
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as unknown as ProductWithCategory;

  // Not a regular catalogue product — try resolving it as a combo pack
  // variety, independently addressable at this same /product/[slug] route
  // (see supabase/migrations/20260918000001_combo_packs.sql). Combo packs
  // are Sri Ram-only for now (multi-shop spec §5.6), so no extra shop check
  // is needed here — but guard anyway in case that ever changes.
  const combo = await getComboVarietyBySlug(slug);
  if (!combo || combo.shopId !== (await getSriRamShopId())) return null;

  return {
    id: combo.varietyId,
    sku: `COMBO-${combo.varietySlug.toUpperCase()}`,
    slug: combo.varietySlug,
    name_en: `${combo.packName} — ${combo.tierLabel}`,
    name_ta: null,
    category_id: "",
    category: { id: "", slug: "", name_en: "Combo Pack", name_ta: null },
    shop_id: combo.shopId,
    shop_slug: "sri-ram-crackers",
    pack: null,
    unit: "pack",
    status: "active",
    is_bestseller: false,
    is_featured: false,
    min_qty: 1,
    image_url: combo.heroImageUrl,
    image_urls: [],
    video_url: null,
    description: null,
    display_order: 0,
    price: combo.sellingPrice,
    is_discountable: false,
    mrp: null,
    discount_percent: null,
    combo,
  };
}

/**
 * Every orderable product's slug — feeds /product/[slug]'s
 * generateStaticParams so all ~200 product pages are pre-rendered at
 * build/deploy time instead of each one paying a cold on-demand-ISR render
 * on its first visit after every revalidate window (the actual cause of
 * "product page takes a long time to open" from the catalogue page).
 */
export async function getAllProductSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("public_products")
    .select("slug")
    .eq("shop_id", await getSriRamShopId())
    .eq("status", "active")
    .not("price", "is", null);
  if (error) throw error;
  return (data ?? []).map((p) => p.slug as string);
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
    .neq("id", excludeProductId);

  if (error) throw error;
  return rankProducts((data ?? []) as unknown as ProductWithCategory[]).slice(0, limit);
}

export async function getBestsellers(limit = 12): Promise<ProductWithCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("public_products")
    .select("*")
    .eq("shop_id", await getSriRamShopId())
    .eq("status", "active")
    .eq("is_bestseller", true)
    .not("price", "is", null);

  if (error) throw error;
  return rankProducts((data ?? []) as unknown as ProductWithCategory[]).slice(0, limit);
}

export async function getFeatured(limit = 12): Promise<ProductWithCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("public_products")
    .select("*")
    .eq("shop_id", await getSriRamShopId())
    .eq("status", "active")
    .eq("is_featured", true)
    .not("price", "is", null);

  if (error) throw error;
  return rankProducts((data ?? []) as unknown as ProductWithCategory[]).slice(0, limit);
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
    .eq("shop_id", await getSriRamShopId())
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
