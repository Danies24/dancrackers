import { rankProducts } from "@/lib/ranking";
import { searchProducts } from "@/lib/catalogue-search";
import type { ProductWithShop } from "@/lib/cross-shop";

export type CrossShopSortOption = "recommended" | "price-asc" | "price-desc";

/**
 * Interleaves each shop's own products round-robin instead of dumping one
 * shop first (multi-shop spec §5.5's "Recommended" default) — each shop's
 * own slice is pre-sorted by the existing rankProducts() tiering first.
 * Pure and framework-agnostic (no "server-only") so both the server-side
 * fetch (lib/cross-shop.ts) and the client-side re-sort (on the sort
 * dropdown changing, with zero extra requests) use the exact same logic.
 */
export function interleaveByShop<T extends ProductWithShop>(products: T[]): T[] {
  const byShop = new Map<string, T[]>();
  for (const p of products) {
    const list = byShop.get(p.shop_id) ?? [];
    list.push(p);
    byShop.set(p.shop_id, list);
  }
  for (const list of byShop.values()) {
    list.splice(0, list.length, ...rankProducts(list));
  }
  const queues = [...byShop.values()];
  const result: T[] = [];
  while (result.length < products.length) {
    let progressed = false;
    for (const queue of queues) {
      if (queue.length > 0) {
        result.push(queue.shift()!);
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  return result;
}

export function sortCrossShopProducts<T extends ProductWithShop>(
  products: T[],
  sort: CrossShopSortOption,
): T[] {
  if (sort === "price-asc") return [...products].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  if (sort === "price-desc") return [...products].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  return interleaveByShop(products);
}

export function searchCrossShopProducts<T extends ProductWithShop>(products: T[], query: string): T[] {
  return searchProducts(products, query) as T[];
}
