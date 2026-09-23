import { rankProducts } from "@/lib/ranking";
import type { ProductWithShop } from "@/lib/cross-shop";

export interface CategoryPageShopMeta {
  id: string;
  slug: string;
  nameEn: string;
  nameTa: string | null;
  locationLabel: string | null;
  dispatchLabel: string | null;
  isFeatured: boolean;
  bestOfferLabel: string | null;
  /**
   * This shop's OWN category slug that maps to the page's group — NOT the
   * group's slug. A per-shop category can be mapped to a group by name
   * pattern rather than a matching slug (see supabase/migrations/
   * 20260922000003_category_groups.sql's Bullet mapping), so the shop
   * PLP's `#cat-${ownCategorySlug}` anchor only resolves correctly with
   * the shop's real slug. Null if this shop has no category in the group
   * (shouldn't happen for a shop with matching products, but the → link
   * falls back to the shop's root page rather than a dead anchor).
   */
  ownCategorySlug: string | null;
}

export interface CategoryPageGroup {
  shop: CategoryPageShopMeta;
  itemCount: number;
  products: ProductWithShop[];
}

export type CategorySortOption = "recommended" | "price-asc" | "price-desc";

/**
 * Buckets a flat cross-shop product list (lib/cross-shop.ts's
 * getCrossShopProducts) into one group per shop that has at least one
 * matching product — a shop with zero matches never appears (Shop-by-
 * Category spec SC-2). Pure and framework-agnostic (no "server-only"), so
 * both the server-side fetch (lib/cross-shop.ts's getCategoryPageData) and
 * the client-side re-filter/re-sort (chips, NO-SOUND, sort — all instant,
 * no network) use the exact same logic, mirroring lib/cross-shop-sort.ts's
 * split for the plain cross-shop grid.
 *
 * Group order: featured shops first, then by item count (most first) — the
 * spec's "FEATURED SHOPS ... ALL SHOPS" split. `sort === "price-asc"`
 * instead orders groups by their own cheapest item (the spec's §5
 * tiebreak); each group's own products are always rankProducts()-tiered
 * internally regardless of the page-level sort.
 */
export function buildCategoryPageGroups(
  products: ProductWithShop[],
  shopMetaById: Map<string, CategoryPageShopMeta>,
  sort: CategorySortOption = "recommended",
): CategoryPageGroup[] {
  const byShop = new Map<string, ProductWithShop[]>();
  for (const p of products) {
    const list = byShop.get(p.shop_id) ?? [];
    list.push(p);
    byShop.set(p.shop_id, list);
  }

  const groups: CategoryPageGroup[] = [];
  for (const [shopId, shopProducts] of byShop) {
    const meta = shopMetaById.get(shopId);
    if (!meta) continue;
    groups.push({ shop: meta, itemCount: shopProducts.length, products: rankProducts(shopProducts) });
  }

  if (sort === "price-asc") return groups.sort((a, b) => cheapestPrice(a.products) - cheapestPrice(b.products));
  if (sort === "price-desc") return groups.sort((a, b) => cheapestPrice(b.products) - cheapestPrice(a.products));

  return groups.sort((a, b) => {
    if (a.shop.isFeatured !== b.shop.isFeatured) return a.shop.isFeatured ? -1 : 1;
    return b.itemCount - a.itemCount;
  });
}

function cheapestPrice(products: ProductWithShop[]): number {
  return Math.min(...products.map((p) => p.price ?? Infinity));
}
