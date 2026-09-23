import type { ProductWithCategory } from "@/lib/data";
import type { ComboPackSummary } from "@/lib/combo-packs";

export interface ShopPlpFlatSection {
  kind: "top-picks" | "recommended" | "under-199";
  products: ProductWithCategory[];
}

export interface ShopPlpComboSection {
  kind: "combos";
  combos: ComboPackSummary[];
}

export interface ShopPlpCategorySection {
  kind: "category";
  categoryId: string;
  categorySlug: string;
  nameEn: string;
  nameTa: string | null;
  products: ProductWithCategory[];
}

export type ShopPlpSection = ShopPlpFlatSection | ShopPlpComboSection | ShopPlpCategorySection;

export interface ShopPlpCategoryInput {
  id: string;
  slug: string;
  name_en: string;
  name_ta: string | null;
  display_order: number;
}

const UNDER_199_THRESHOLD = 199;

/**
 * Buckets one shop's already-fetched catalogue (already `rankProducts()`-
 * tiered by `getShopCatalogue()`) into the PLP's sections — Top Picks /
 * Recommended / Under-₹199 / Combos first, then one "category" section per
 * active category in the shop's own display_order. Pure and
 * framework-agnostic (no "server-only"), mirroring lib/cross-shop-sort.ts's
 * split between pure bucketing logic and the server-side fetch that calls
 * it (lib/shops.ts's getShopPlpSections()) — one getShopCatalogue() fetch
 * feeds every section here, never one query per section.
 *
 * A product can land in more than one bucket (e.g. a top pick that's also
 * under ₹199) — sections overlap on purpose, same as Swiggy's own dish
 * groupings. Empty sections are omitted entirely so the PLP never renders a
 * header with nothing under it.
 */
export function buildShopPlpSections(
  products: ProductWithCategory[],
  categories: ShopPlpCategoryInput[],
  combos: ComboPackSummary[] = [],
): ShopPlpSection[] {
  const sections: ShopPlpSection[] = [];

  const topPicks = products.filter((p) => p.is_top_pick);
  if (topPicks.length > 0) sections.push({ kind: "top-picks", products: topPicks });

  const recommended = products.filter((p) => p.is_recommended);
  if (recommended.length > 0) sections.push({ kind: "recommended", products: recommended });

  const under199 = products.filter((p) => p.price !== null && p.price < UNDER_199_THRESHOLD);
  if (under199.length > 0) sections.push({ kind: "under-199", products: under199 });

  if (combos.length > 0) sections.push({ kind: "combos", combos });

  const byCategory = new Map<string, ProductWithCategory[]>();
  for (const p of products) {
    const list = byCategory.get(p.category_id) ?? [];
    list.push(p);
    byCategory.set(p.category_id, list);
  }

  const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);
  for (const c of sortedCategories) {
    const inCategory = byCategory.get(c.id);
    if (!inCategory || inCategory.length === 0) continue;
    sections.push({
      kind: "category",
      categoryId: c.id,
      categorySlug: c.slug,
      nameEn: c.name_en,
      nameTa: c.name_ta,
      products: inCategory,
    });
  }

  return sections;
}
