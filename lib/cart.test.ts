import { describe, expect, it } from "vitest";
import {
  addItem,
  decrementItem,
  emptyCart,
  incrementItem,
  parseCart,
  removeItem,
  serializeCart,
  setItemQty,
} from "./cart";

const product = { productId: "p1", sku: "047", price: 144 };

describe("addItem", () => {
  it("adds a new line with quantity 1 by default", () => {
    const state = addItem(emptyCart(), product);
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ productId: "p1", sku: "047", qty: 1, priceAtAdd: 144 });
  });

  it("increments an existing line instead of duplicating it", () => {
    let state = addItem(emptyCart(), product);
    state = addItem(state, product, 2);
    expect(state.items).toHaveLength(1);
    expect(state.items[0].qty).toBe(3);
  });
});

describe("increment / decrement", () => {
  it("increments by one", () => {
    let state = addItem(emptyCart(), product);
    state = incrementItem(state, "p1");
    expect(state.items[0].qty).toBe(2);
  });

  it("removes the line when decrementing to zero (§15.2)", () => {
    let state = addItem(emptyCart(), product, 1);
    state = decrementItem(state, "p1");
    expect(state.items).toHaveLength(0);
  });

  it("is a no-op on a product not in the cart", () => {
    const state = incrementItem(emptyCart(), "nonexistent");
    expect(state.items).toHaveLength(0);
  });
});

describe("setItemQty", () => {
  it("removes the line for a non-positive quantity", () => {
    let state = addItem(emptyCart(), product, 5);
    state = setItemQty(state, "p1", 0);
    expect(state.items).toHaveLength(0);
    state = addItem(state, product, 5);
    state = setItemQty(state, "p1", -3);
    expect(state.items).toHaveLength(0);
  });
});

describe("removeItem", () => {
  it("removes the specified line only", () => {
    let state = addItem(emptyCart(), product);
    state = addItem(state, { productId: "p2", sku: "048", price: 200 });
    state = removeItem(state, "p1");
    expect(state.items).toHaveLength(1);
    expect(state.items[0].productId).toBe("p2");
  });
});

describe("serializeCart / parseCart — persistence round trip", () => {
  it("round-trips a populated cart", () => {
    const state = addItem(emptyCart(), product, 3);
    const restored = parseCart(serializeCart(state));
    expect(restored.items).toEqual(state.items);
  });

  it("recovers to an empty cart on corrupt JSON", () => {
    const restored = parseCart("{not valid json");
    expect(restored.items).toHaveLength(0);
  });

  it("recovers to an empty cart on a schema version mismatch", () => {
    const restored = parseCart(JSON.stringify({ v: 999, updatedAt: Date.now(), items: [] }));
    expect(restored.items).toHaveLength(0);
  });

  it("recovers to an empty cart when older than the 30-day TTL", () => {
    const stale = {
      v: 1,
      updatedAt: Date.now() - 31 * 86_400_000,
      items: [{ productId: "p1", sku: "047", qty: 1, priceAtAdd: 144 }],
    };
    const restored = parseCart(JSON.stringify(stale));
    expect(restored.items).toHaveLength(0);
  });

  it("survives well within the TTL", () => {
    const recent = {
      v: 1,
      updatedAt: Date.now() - 1 * 86_400_000,
      items: [{ productId: "p1", sku: "047", qty: 1, priceAtAdd: 144 }],
    };
    const restored = parseCart(JSON.stringify(recent));
    expect(restored.items).toHaveLength(1);
  });

  it("returns an empty cart for null/undefined input", () => {
    expect(parseCart(null).items).toHaveLength(0);
    expect(parseCart(undefined).items).toHaveLength(0);
  });

  it("drops malformed individual items rather than throwing", () => {
    const raw = JSON.stringify({
      v: 1,
      updatedAt: Date.now(),
      items: [
        { productId: "p1", sku: "047", qty: 1, priceAtAdd: 144 },
        { productId: "bad" }, // missing fields
      ],
    });
    const restored = parseCart(raw);
    expect(restored.items).toHaveLength(1);
  });
});
