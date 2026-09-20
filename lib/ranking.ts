/**
 * "Best crackers first" ranking implementation (§3).
 *
 * Sorts products into four strictly prioritized tiers:
 * 1. Has a real image AND is_best = true
 * 2. Has a real image, not best
 * 3. No image, is_best = true
 * 4. No image, not best
 *
 * Within each group, sort by display_order ascending, then name (English) ascending.
 */

export interface RankableProduct {
  image_url?: string | null;
  is_best?: boolean | null;
  is_featured?: boolean | null;
  display_order?: number | null;
  name_en?: string | null;
}

/**
 * Returns true if the product has at least one real uploaded image, not a placeholder or empty string.
 */
export function hasRealImage(p: { image_url?: string | null }): boolean {
  if (!p.image_url) return false;
  const trimmed = p.image_url.trim();
  if (!trimmed) return false;
  if (trimmed.toLowerCase().includes("placeholder") || trimmed.toLowerCase().includes("placehold")) return false;
  return true;
}

/**
 * Returns true if the product is flagged as "best cracker" (checking is_best or existing is_featured).
 */
export function isBestProduct(p: { is_best?: boolean | null; is_featured?: boolean | null }): boolean {
  return Boolean(p.is_best ?? p.is_featured);
}

/**
 * Shared ranking function used across catalogue listings, category pages,
 * tied search results, and recommendation rails (§3.3).
 */
export function rankProducts<T extends RankableProduct>(products: T[]): T[] {
  function getTier(p: T): number {
    const hasImg = hasRealImage(p);
    const isBest = isBestProduct(p);
    if (hasImg && isBest) return 1;
    if (hasImg && !isBest) return 2;
    if (!hasImg && isBest) return 3;
    return 4;
  }

  return [...products].sort((a, b) => {
    const tierA = getTier(a);
    const tierB = getTier(b);
    if (tierA !== tierB) return tierA - tierB;
    const orderA = a.display_order ?? 0;
    const orderB = b.display_order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return (a.name_en ?? "").localeCompare(b.name_en ?? "");
  });
}
