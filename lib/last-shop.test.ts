import { describe, expect, it } from "vitest";
import { chooseContinueShop, parseLastShop } from "./last-shop";

const NOW = 1_800_000_000_000;
const day = 86_400_000;
const ok = (over = {}) => JSON.stringify({ v: 1, slug: "s", name: "S", at: NOW - day, ...over });

describe("parseLastShop", () => {
  it("parses a valid entry", () => expect(parseLastShop(ok(), NOW)?.slug).toBe("s"));
  it("returns null for bad JSON, null and empty", () => {
    expect(parseLastShop("{nope", NOW)).toBeNull();
    expect(parseLastShop(null, NOW)).toBeNull();
    expect(parseLastShop("", NOW)).toBeNull();
  });
  it("rejects an expired entry", () => expect(parseLastShop(ok({ at: NOW - 46 * day }), NOW)).toBeNull());
  it("rejects a wrong version", () => expect(parseLastShop(ok({ v: 2 }), NOW)).toBeNull());
  it("rejects missing fields", () => expect(parseLastShop(ok({ slug: undefined }), NOW)).toBeNull());
});

describe("chooseContinueShop", () => {
  const last = { v: 1, slug: "last", name: "Last", at: NOW };
  it("prefers the cart's shop over the last shop", () => {
    const r = chooseContinueShop({ shopSlug: "cart", shopName: "Cart", itemCount: 6 }, last);
    expect(r).toMatchObject({ slug: "cart", source: "cart", itemCount: 6 });
  });
  it("falls back to last when the cart is empty", () => {
    expect(chooseContinueShop({ shopSlug: null, shopName: null, itemCount: 0 }, last)?.source).toBe("last");
  });
  it("returns null with neither", () => {
    expect(chooseContinueShop({ shopSlug: null, shopName: null, itemCount: 0 }, null)).toBeNull();
  });
});
