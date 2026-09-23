import { describe, expect, it } from "vitest";
import { buildShopPlpSections, type ShopPlpCategoryInput } from "./shop-plp-sections";
import type { ProductWithCategory } from "./data";
import type { ComboPackSummary } from "./combo-packs";

function product(overrides: Partial<ProductWithCategory> & { id: string; category_id: string }): ProductWithCategory {
  return {
    sku: overrides.id,
    slug: overrides.id,
    name_en: overrides.id,
    name_ta: null,
    shop_id: "shop-1",
    shop_slug: "sri-ram-crackers",
    pack: null,
    unit: "box",
    status: "active",
    is_bestseller: false,
    is_featured: false,
    min_qty: 1,
    image_url: null,
    image_urls: [],
    video_url: null,
    description: null,
    display_order: 0,
    price: 100,
    is_discountable: false,
    mrp: null,
    discount_percent: null,
    category: { id: overrides.category_id, slug: "cat", name_en: "Category", name_ta: null },
    ...overrides,
  };
}

const sparklers: ShopPlpCategoryInput = { id: "cat-sparklers", slug: "sparklers", name_en: "Sparklers", name_ta: null, display_order: 1 };
const bombs: ShopPlpCategoryInput = { id: "cat-bombs", slug: "bombs", name_en: "Bombs", name_ta: null, display_order: 2 };

describe("buildShopPlpSections", () => {
  it("omits every flat section that has no matching products", () => {
    const sections = buildShopPlpSections([product({ id: "p1", category_id: "cat-sparklers", price: 500 })], [sparklers]);
    expect(sections.map((s) => s.kind)).toEqual(["category"]);
  });

  it("buckets top picks and recommended independently of each other", () => {
    const p1 = product({ id: "p1", category_id: "cat-sparklers", is_top_pick: true });
    const p2 = product({ id: "p2", category_id: "cat-sparklers", is_recommended: true });
    const sections = buildShopPlpSections([p1, p2], [sparklers]);
    const topPicks = sections.find((s) => s.kind === "top-picks");
    const recommended = sections.find((s) => s.kind === "recommended");
    expect(topPicks && "products" in topPicks ? topPicks.products.map((p) => p.sku) : []).toEqual(["p1"]);
    expect(recommended && "products" in recommended ? recommended.products.map((p) => p.sku) : []).toEqual(["p2"]);
  });

  it("lets a product land in more than one bucket at once", () => {
    const p1 = product({ id: "p1", category_id: "cat-sparklers", is_top_pick: true, price: 99 });
    const sections = buildShopPlpSections([p1], [sparklers]);
    expect(sections.map((s) => s.kind)).toEqual(expect.arrayContaining(["top-picks", "under-199", "category"]));
  });

  it("buckets under-₹199 strictly below the threshold, not at it", () => {
    const cheap = product({ id: "cheap", category_id: "cat-sparklers", price: 198 });
    const boundary = product({ id: "boundary", category_id: "cat-sparklers", price: 199 });
    const sections = buildShopPlpSections([cheap, boundary], [sparklers]);
    const under199 = sections.find((s) => s.kind === "under-199");
    expect(under199 && "products" in under199 ? under199.products.map((p) => p.sku) : []).toEqual(["cheap"]);
  });

  it("includes a combos section only when combos are passed, never with empty products", () => {
    const combos = [{ packId: "c1" } as unknown as ComboPackSummary];
    const sections = buildShopPlpSections([], [], combos);
    expect(sections).toHaveLength(1);
    expect(sections[0]).toMatchObject({ kind: "combos", combos });
  });

  it("orders category sections by the shop's own display_order, not input order", () => {
    const p1 = product({ id: "p1", category_id: "cat-bombs" });
    const p2 = product({ id: "p2", category_id: "cat-sparklers" });
    const sections = buildShopPlpSections([p1, p2], [bombs, sparklers]);
    const categorySections = sections.filter((s) => s.kind === "category");
    expect(categorySections.map((s) => (s as { categorySlug: string }).categorySlug)).toEqual(["sparklers", "bombs"]);
  });

  it("omits a category section entirely when it has zero matching products", () => {
    const p1 = product({ id: "p1", category_id: "cat-sparklers" });
    const sections = buildShopPlpSections([p1], [sparklers, bombs]);
    expect(sections.filter((s) => s.kind === "category")).toHaveLength(1);
  });
});
