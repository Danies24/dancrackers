import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { sortCrossShopProducts, type CrossShopSortOption } from "@/lib/cross-shop-sort";
import type { Database } from "@/types/database";
import type { ProductWithCategory } from "@/lib/data";
import type { ShopRow } from "@/lib/shops";

export type CategoryGroupRow = Database["public"]["Tables"]["category_groups"]["Row"];

export interface ProductWithShop extends ProductWithCategory {
  shop: Pick<ShopRow, "id" | "slug" | "name_en" | "name_ta">;
}

/**
 * Every shop a customer can browse across shops (multi-shop spec §5.5) —
 * `coming_soon` and `hidden` shops never appear here: a coming_soon shop
 * has no products to show anyway, and a hidden one must never surface
 * outside its own preview-gated page.
 */
export async function getBrowsableShops(): Promise<ShopRow[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("status", "active")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCategoryGroupBySlug(slug: string): Promise<CategoryGroupRow | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("category_groups").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/**
 * The shared read behind /products and /products/[groupSlug] (multi-shop
 * spec §5.5) — every active shop's catalogue, optionally narrowed to one
 * category group and/or one shop, each product carrying its shop info for
 * the card's shop-name chip.
 */
export async function getCrossShopProducts(opts: {
  groupId?: string;
  shopSlug?: string;
  sort?: CrossShopSortOption;
}): Promise<ProductWithShop[]> {
  const shops = await getBrowsableShops();
  if (shops.length === 0) return [];
  const shopById = new Map(shops.map((s) => [s.id, s]));

  const supabase = createPublicClient();
  let query = supabase
    .from("public_products")
    .select("*")
    .eq("status", "active")
    .not("price", "is", null)
    .in(
      "shop_id",
      shops.map((s) => s.id),
    );

  if (opts.shopSlug) {
    const shop = shops.find((s) => s.slug === opts.shopSlug);
    if (!shop) return [];
    query = query.eq("shop_id", shop.id);
  }

  if (opts.groupId) {
    const { data: cats, error: catError } = await supabase.from("categories").select("id").eq("group_id", opts.groupId);
    if (catError) throw catError;
    const categoryIds = (cats ?? []).map((c) => c.id);
    if (categoryIds.length === 0) return [];
    query = query.in("category_id", categoryIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  const withShop: ProductWithShop[] = (data as unknown as ProductWithCategory[]).map((p) => ({
    ...p,
    shop: shopById.get(p.shop_id)!,
  }));

  return sortCrossShopProducts(withShop, opts.sort ?? "recommended");
}
