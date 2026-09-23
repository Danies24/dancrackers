import { describe, expect, it } from "vitest";
import {
  addItem,
  cartShopConflicts,
  decrementItem,
  emptyCart,
  incrementItem,
  parseCart,
  removeItem,
  serializeCart,
  setItemQty,
  SRI_RAM_SHOP,
  type CartShop,
} from "./cart";

const product = { productId: "p1", sku: "047", price: 144 };
const shopA: CartShop = { id: "shop-a", slug: "shop-a", name: "Shop A" };
const shopB: CartShop = { id: "shop-b", slug: "shop-b", name: "Shop B" };

describe("addItem", () => {
  it("adds a new line with quantity 1 by default and sets the cart's shop", () => {
    const state = addItem(emptyCart(), product, 1, shopA);
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ productId: "p1", sku: "047", qty: 1, priceAtAdd: 144 });
    expect(state.shopId).toBe(shopA.id);
    expect(state.shopSlug).toBe(shopA.slug);
    expect(state.shopName).toBe(shopA.name);
  });

  it("increments an existing line instead of duplicating it", () => {
    let state = addItem(emptyCart(), product, 1, shopA);
    state = addItem(state, product, 2, shopA);
    expect(state.items).toHaveLength(1);
    expect(state.items[0].qty).toBe(3);
  });
});

describe("cartShopConflicts (multi-shop spec §6)", () => {
  it("is false for an empty cart, regardless of shop", () => {
    expect(cartShopConflicts(emptyCart(), shopB.id)).toBe(false);
  });

  it("is false when adding from the same shop already in the cart", () => {
    const state = addItem(emptyCart(), product, 1, shopA);
    expect(cartShopConflicts(state, shopA.id)).toBe(false);
  });

  it("is true when adding from a different shop than what's already in the cart", () => {
    const state = addItem(emptyCart(), product, 1, shopA);
    expect(cartShopConflicts(state, shopB.id)).toBe(true);
  });

  it("resets to no conflict once the cart empties out again", () => {
    let state = addItem(emptyCart(), product, 1, shopA);
    state = removeItem(state, "p1");
    expect(state.shopId).toBeNull();
    expect(cartShopConflicts(state, shopB.id)).toBe(false);
  });
});

describe("increment / decrement", () => {
  it("increments by one", () => {
    let state = addItem(emptyCart(), product, 1, shopA);
    state = incrementItem(state, "p1");
    expect(state.items[0].qty).toBe(2);
  });

  it("removes the line when decrementing to zero (§15.2)", () => {
    let state = addItem(emptyCart(), product, 1, shopA);
    state = decrementItem(state, "p1");
    expect(state.items).toHaveLength(0);
    expect(state.shopId).toBeNull();
  });

  it("is a no-op on a product not in the cart", () => {
    const state = incrementItem(emptyCart(), "nonexistent");
    expect(state.items).toHaveLength(0);
  });
});

describe("setItemQty", () => {
  it("removes the line for a non-positive quantity", () => {
    let state = addItem(emptyCart(), product, 5, shopA);
    state = setItemQty(state, "p1", 0);
    expect(state.items).toHaveLength(0);
    state = addItem(state, product, 5, shopA);
    state = setItemQty(state, "p1", -3);
    expect(state.items).toHaveLength(0);
  });
});

describe("removeItem", () => {
  it("removes the specified line only", () => {
    let state = addItem(emptyCart(), product, 1, shopA);
    state = addItem(state, { productId: "p2", sku: "048", price: 200 }, 1, shopA);
    state = removeItem(state, "p1");
    expect(state.items).toHaveLength(1);
    expect(state.items[0].productId).toBe("p2");
  });
});

describe("serializeCart / parseCart — persistence round trip", () => {
  it("round-trips a populated cart, including its shop", () => {
    const state = addItem(emptyCart(), product, 3, shopA);
    const restored = parseCart(serializeCart(state));
    expect(restored.items).toEqual(state.items);
    expect(restored.shopId).toBe(shopA.id);
    expect(restored.shopSlug).toBe(shopA.slug);
    expect(restored.shopName).toBe(shopA.name);
  });

  it("recovers to an empty cart on corrupt JSON", () => {
    const restored = parseCart("{not valid json");
    expect(restored.items).toHaveLength(0);
  });

  it("recovers to an empty cart on a schema version mismatch", () => {
    const restored = parseCart(JSON.stringify({ v: 999, updatedAt: Date.now(), items: [] }));
    expect(restored.items).toHaveLength(0);
  });

  it("migrates a pre-multi-shop (v1) cart to Sri Ram rather than wiping it", () => {
    const v1 = {
      v: 1,
      updatedAt: Date.now(),
      items: [{ productId: "p1", sku: "047", qty: 1, priceAtAdd: 144 }],
    };
    const restored = parseCart(JSON.stringify(v1));
    expect(restored.items).toHaveLength(1);
    expect(restored.shopId).toBe(SRI_RAM_SHOP.id);
    expect(restored.shopSlug).toBe(SRI_RAM_SHOP.slug);
    expect(restored.shopName).toBe(SRI_RAM_SHOP.name);
  });

  it("recovers to an empty cart when older than the 30-day TTL", () => {
    const stale = {
      v: 2,
      updatedAt: Date.now() - 31 * 86_400_000,
      shopId: shopA.id,
      shopSlug: shopA.slug,
      shopName: shopA.name,
      items: [{ productId: "p1", sku: "047", qty: 1, priceAtAdd: 144 }],
    };
    const restored = parseCart(JSON.stringify(stale));
    expect(restored.items).toHaveLength(0);
  });

  it("survives well within the TTL", () => {
    const recent = {
      v: 2,
      updatedAt: Date.now() - 1 * 86_400_000,
      shopId: shopA.id,
      shopSlug: shopA.slug,
      shopName: shopA.name,
      items: [{ productId: "p1", sku: "047", qty: 1, priceAtAdd: 144 }],
    };
    const restored = parseCart(JSON.stringify(recent));
    expect(restored.items).toHaveLength(1);
    expect(restored.shopId).toBe(shopA.id);
  });

  it("returns an empty cart for null/undefined input", () => {
    expect(parseCart(null).items).toHaveLength(0);
    expect(parseCart(undefined).items).toHaveLength(0);
  });

  it("drops malformed individual items rather than throwing", () => {
    const raw = JSON.stringify({
      v: 2,
      updatedAt: Date.now(),
      shopId: shopA.id,
      shopSlug: shopA.slug,
      shopName: shopA.name,
      items: [
        { productId: "p1", sku: "047", qty: 1, priceAtAdd: 144 },
        { productId: "bad" }, // missing fields
      ],
    });
    const restored = parseCart(raw);
    expect(restored.items).toHaveLength(1);
  });
});
