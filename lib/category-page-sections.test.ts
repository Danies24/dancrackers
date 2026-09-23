import { describe, expect, it } from "vitest";
import { buildCategoryPageGroups, type CategoryPageShopMeta } from "./category-page-sections";
import type { ProductWithShop } from "./cross-shop";

function product(overrides: Partial<ProductWithShop> & { id: string; shop_id: string }): ProductWithShop {
  return {
    sku: overrides.id,
    slug: overrides.id,
    name_en: overrides.id,
    name_ta: null,
    category_id: "cat-1",
    shop_slug: "shop",
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
    category: { id: "cat-1", slug: "sparklers", name_en: "Sparklers", name_ta: null },
    shop: { id: overrides.shop_id, slug: "shop", name_en: "Shop", name_ta: null },
    ...overrides,
  };
}

function shopMeta(overrides: Partial<CategoryPageShopMeta> & { id: string }): CategoryPageShopMeta {
  return {
    slug: overrides.id,
    nameEn: overrides.id,
    nameTa: null,
    locationLabel: null,
    dispatchLabel: null,
    isFeatured: false,
    bestOfferLabel: null,
    ownCategorySlug: null,
    ...overrides,
  };
}

describe("buildCategoryPageGroups", () => {
  it("creates one group per shop with at least one matching product", () => {
    const products = [product({ id: "p1", shop_id: "shop-a" }), product({ id: "p2", shop_id: "shop-b" })];
    const shopMetaById = new Map([
      ["shop-a", shopMeta({ id: "shop-a" })],
      ["shop-b", shopMeta({ id: "shop-b" })],
    ]);
    const groups = buildCategoryPageGroups(products, shopMetaById);
    expect(groups).toHaveLength(2);
  });

  it("never creates a group for a shop with zero matching products (SC-2)", () => {
    const products = [product({ id: "p1", shop_id: "shop-a" })];
    const shopMetaById = new Map([
      ["shop-a", shopMeta({ id: "shop-a" })],
      ["shop-b", shopMeta({ id: "shop-b" })],
    ]);
    const groups = buildCategoryPageGroups(products, shopMetaById);
    expect(groups.map((g) => g.shop.id)).toEqual(["shop-a"]);
  });

  it("orders featured shops before non-featured, regardless of item count", () => {
    const products = [
      product({ id: "p1", shop_id: "shop-big" }),
      product({ id: "p2", shop_id: "shop-big" }),
      product({ id: "p3", shop_id: "shop-featured" }),
    ];
    const shopMetaById = new Map([
      ["shop-big", shopMeta({ id: "shop-big", isFeatured: false })],
      ["shop-featured", shopMeta({ id: "shop-featured", isFeatured: true })],
    ]);
    const groups = buildCategoryPageGroups(products, shopMetaById);
    expect(groups.map((g) => g.shop.id)).toEqual(["shop-featured", "shop-big"]);
  });

  it("within the same featured tier, orders by item count descending", () => {
    const products = [
      product({ id: "p1", shop_id: "shop-a" }),
      product({ id: "p2", shop_id: "shop-b" }),
      product({ id: "p3", shop_id: "shop-b" }),
      product({ id: "p4", shop_id: "shop-b" }),
    ];
    const shopMetaById = new Map([
      ["shop-a", shopMeta({ id: "shop-a" })],
      ["shop-b", shopMeta({ id: "shop-b" })],
    ]);
    const groups = buildCategoryPageGroups(products, shopMetaById);
    expect(groups.map((g) => g.shop.id)).toEqual(["shop-b", "shop-a"]);
  });

  it("price-asc sort orders groups by their own cheapest item", () => {
    const products = [
      product({ id: "p1", shop_id: "shop-a", price: 500 }),
      product({ id: "p2", shop_id: "shop-b", price: 50 }),
      product({ id: "p3", shop_id: "shop-b", price: 900 }),
    ];
    const shopMetaById = new Map([
      ["shop-a", shopMeta({ id: "shop-a" })],
      ["shop-b", shopMeta({ id: "shop-b" })],
    ]);
    const groups = buildCategoryPageGroups(products, shopMetaById, "price-asc");
    expect(groups.map((g) => g.shop.id)).toEqual(["shop-b", "shop-a"]);
  });

  it("drops a product whose shop has no metadata entry (defensive — should never happen in practice)", () => {
    const products = [product({ id: "p1", shop_id: "shop-unknown" })];
    const groups = buildCategoryPageGroups(products, new Map());
    expect(groups).toHaveLength(0);
  });
});
