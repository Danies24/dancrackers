import type { ProductWithCategory } from "@/lib/data";

/** Case- and whitespace-insensitive substring match across name_en, name_ta, category, sku (§13.4). */
function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function searchProducts(products: ProductWithCategory[], rawQuery: string): ProductWithCategory[] {
  const query = normalize(rawQuery);
  if (!query) return products;
  return products.filter((p) => {
    const haystacks = [p.name_en, p.name_ta ?? "", p.category?.name_en ?? "", p.sku];
    return haystacks.some((h) => normalize(h).includes(query));
  });
}

export type SortOption = "recommended" | "price-asc" | "price-desc";

export function sortProducts(products: ProductWithCategory[], sort: SortOption): ProductWithCategory[] {
  const copy = [...products];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case "price-desc":
      return copy.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case "recommended":
    default:
      return copy.sort((a, b) => a.display_order - b.display_order);
  }
}
