import { describe, expect, it } from "vitest";
import {
  buildShareUrl,
  buildShortShareUrl,
  decodeCartItems,
  encodeCartItems,
  exceedsShareUrlLimit,
  SHARE_URL_LENGTH_LIMIT,
} from "./cart-share";

describe("encodeCartItems / decodeCartItems", () => {
  it("round-trips a normal cart", () => {
    const items = [
      { slug: "seven-shot", qty: 2 },
      { slug: "flower-pot-mini", qty: 5 },
    ];
    const encoded = encodeCartItems(items);
    expect(encoded).toBe("seven-shot.2,flower-pot-mini.5");
    expect(decodeCartItems(encoded)).toEqual(items);
  });

  it("drops malformed pairs (bad slug, zero/negative/non-numeric qty) without throwing", () => {
    const decoded = decodeCartItems("valid-slug.3,BadSlug!.2,other-slug.0,third-slug.-5,,fourth-slug.abc,fifth-slug.7");
    expect(decoded).toEqual([
      { slug: "valid-slug", qty: 3 },
      { slug: "fifth-slug", qty: 7 },
    ]);
  });

  it("returns an empty list for empty/undefined/null input", () => {
    expect(decodeCartItems("")).toEqual([]);
    expect(decodeCartItems(undefined)).toEqual([]);
    expect(decodeCartItems(null)).toEqual([]);
  });

  it("has no price field at all — an injected price-looking segment is just an ordinary (dropped-later) item", () => {
    const decoded = decodeCartItems("seven-shot.2,price.999999,seven-shot.2");
    // "price.999999" parses as slug="price" qty=999 (capped) — a perfectly
    // valid-shaped pair, exactly demonstrating the format carries no price
    // semantics: it's indistinguishable from a real item, and /cart/shared
    // would just look up a nonexistent "price" slug and drop it as
    // unavailable, never treat any number in the link as a monetary value.
    expect(decoded.some((i) => i.slug === "price")).toBe(true);
    expect(decoded.find((i) => i.slug === "price")?.qty).toBe(999);
  });

  it("caps an oversized quantity at 999", () => {
    expect(decodeCartItems("seven-shot.5000")).toEqual([{ slug: "seven-shot", qty: 999 }]);
  });
});

describe("buildShareUrl / buildShortShareUrl / exceedsShareUrlLimit", () => {
  it("builds the compact ?s=&i= link format", () => {
    const url = buildShareUrl("https://kolagalam.vercel.app", "sri-ram-crackers", [{ slug: "seven-shot", qty: 2 }]);
    expect(url).toBe("https://kolagalam.vercel.app/cart/shared?s=sri-ram-crackers&i=seven-shot.2");
  });

  it("builds the short ?id= fallback link", () => {
    const url = buildShortShareUrl("https://kolagalam.vercel.app", "abc123");
    expect(url).toBe("https://kolagalam.vercel.app/cart/shared?id=abc123");
  });

  it("flags a very long cart as over the length limit", () => {
    const items = Array.from({ length: 300 }, (_, i) => ({ slug: `some-fairly-long-product-slug-name-${i}`, qty: 5 }));
    const url = buildShareUrl("https://kolagalam.vercel.app", "sri-ram-crackers", items);
    expect(url.length).toBeGreaterThan(SHARE_URL_LENGTH_LIMIT);
    expect(exceedsShareUrlLimit(url)).toBe(true);
  });

  it("does not flag a normal-sized cart", () => {
    const url = buildShareUrl("https://kolagalam.vercel.app", "sri-ram-crackers", [
      { slug: "seven-shot", qty: 2 },
      { slug: "flower-pot-mini", qty: 5 },
    ]);
    expect(exceedsShareUrlLimit(url)).toBe(false);
  });
});
