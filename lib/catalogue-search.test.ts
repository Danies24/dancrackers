import { describe, expect, it } from "vitest";
import { searchProducts, sortProducts } from "./catalogue-search";
import type { ProductWithCategory } from "@/lib/data";

function makeProduct(
  overrides: Partial<ProductWithCategory> & { categoryName?: string },
): ProductWithCategory {
  const { categoryName, ...rest } = overrides;
  return {
    id: rest.id ?? "1",
    sku: rest.sku ?? "001",
    slug: rest.slug ?? "product",
    name_en: rest.name_en ?? "Product",
    name_ta: rest.name_ta ?? null,
    category_id: "cat-1",
    price: rest.price ?? 100,
    unit: "pkt",
    is_discountable: true,
    min_qty: 1,
    image_url: null,
    image_urls: [],
    description: null,
    status: "active",
    is_bestseller: false,
    is_featured: false,
    display_order: rest.display_order ?? 0,
    created_at: "",
    updated_at: "",
    category: { id: "cat-1", slug: "cat", name_en: categoryName ?? "Category", name_ta: null },
    ...rest,
  } as ProductWithCategory;
}

describe("searchProducts", () => {
  const products = [
    makeProduct({ id: "1", name_en: "Ground Chakkar Big", name_ta: "தரைச்சக்கரம் பெரியது" }),
    makeProduct({ id: "2", name_en: "Seven Shot", name_ta: "7 ஷாட்" }),
  ];

  it("matches by English name substring, case-insensitive", () => {
    expect(searchProducts(products, "chakkar")).toHaveLength(1);
    expect(searchProducts(products, "CHAKKAR")).toHaveLength(1);
  });

  it("matches by Tamil name", () => {
    expect(searchProducts(products, "தரைச்சக்கரம்")).toHaveLength(1);
  });

  it("matches by category name", () => {
    const withCat = [makeProduct({ id: "3", name_en: "X", categoryName: "Gift Boxes" })];
    expect(searchProducts(withCat, "gift")).toHaveLength(1);
  });

  it("returns everything for an empty query", () => {
    expect(searchProducts(products, "")).toHaveLength(2);
    expect(searchProducts(products, "   ")).toHaveLength(2);
  });

  it("returns nothing for a query matching no product", () => {
    expect(searchProducts(products, "zzzznotfound")).toHaveLength(0);
  });
});

describe("sortProducts", () => {
  const products = [
    makeProduct({ id: "1", price: 300, display_order: 3 }),
    makeProduct({ id: "2", price: 100, display_order: 1 }),
    makeProduct({ id: "3", price: 200, display_order: 2 }),
  ];

  it("sorts by display_order for 'recommended'", () => {
    const sorted = sortProducts(products, "recommended");
    expect(sorted.map((p) => p.id)).toEqual(["2", "3", "1"]);
  });

  it("sorts ascending by price", () => {
    const sorted = sortProducts(products, "price-asc");
    expect(sorted.map((p) => p.price)).toEqual([100, 200, 300]);
  });

  it("sorts descending by price", () => {
    const sorted = sortProducts(products, "price-desc");
    expect(sorted.map((p) => p.price)).toEqual([300, 200, 100]);
  });

  it("does not mutate the input array", () => {
    const original = [...products];
    sortProducts(products, "price-asc");
    expect(products).toEqual(original);
  });
});
