import { isGurusamyShop } from "@/config/deliveryConfig";

/**
 * The "Upto X% OFF" badge text shown on the home page's Our Shops cards
 * (components/shop/shop-showcase-card.tsx), /search, and each shop's own
 * page header (components/shop/shop-plp-header.tsx) — one place so the two
 * call sites never drift back out of sync the way they did before (both
 * used to hardcode the identical text independently). Gurusamy sells
 * wholesale, factory-direct — its own copy reflects that; every other shop
 * gets the plain claim.
 */
export function getShopDiscountBadgeText(shopSlug: string | null | undefined, maxDiscountPercent: number): string {
  const pct = Math.max(maxDiscountPercent, 80);
  return isGurusamyShop(shopSlug) ? `Upto ${pct}% off - Branded crackers` : `Upto ${pct}% Off`;
}
