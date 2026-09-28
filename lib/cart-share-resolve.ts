import "server-only";
import { getShopBySlug, getShopProductBySlug, type ShopRow } from "@/lib/shops";
import { computeTotals, type PricingResult } from "@/lib/pricing";
import type { ProductWithCategory } from "@/lib/data";
import type { ShareCartItem } from "@/lib/cart-share";

export interface ResolvedSharedCartLine {
  product: ProductWithCategory;
  qty: number;
}

export interface ResolvedSharedCart {
  shop: ShopRow;
  lines: ResolvedSharedCartLine[];
  totals: PricingResult;
  /** Slugs from the link that no longer resolve to a purchasable product — dropped silently. */
  droppedCount: number;
}

/**
 * The /cart/shared resolver — re-fetches every item from the live catalogue
 * by slug (getShopProductBySlug, already used by the shop product page) and
 * recomputes totals server-side. Nothing from the URL (a price, a total)
 * is ever trusted; only the shop slug and item slugs are read from it.
 */
export async function resolveSharedCart(shopSlug: string, items: ShareCartItem[]): Promise<ResolvedSharedCart | null> {
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return null;

  const results = await Promise.all(items.map((i) => getShopProductBySlug(shop, i.slug)));

  const lines: ResolvedSharedCartLine[] = [];
  let droppedCount = 0;
  results.forEach((product, idx) => {
    if (!product || product.price == null || product.status !== "active") {
      droppedCount += 1;
      return;
    }
    lines.push({ product, qty: items[idx].qty });
  });

  const totals = computeTotals(
    lines.map((l) => ({
      price: l.product.price!,
      quantity: l.qty,
      isDiscountable: l.product.is_discountable,
      mrp: l.product.mrp,
    })),
    shop.slug,
  );

  return { shop, lines, totals, droppedCount };
}
