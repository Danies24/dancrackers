import { describe, expect, it } from "vitest";
import { toShopTiles, tileMetaLine, type ShopTileInput } from "./shop-picker";

function card(slug: string, status: string, productCount = 10, maxDiscountPercent = 0): ShopTileInput {
  return { shop: { slug, name_en: slug, name_ta: null, logo_url: null, status }, productCount, maxDiscountPercent };
}
const orderable = (s: string) => s === "a" || s === "gurusamy-fireworks";

describe("toShopTiles", () => {
  it("maps status + orderability to a state", () => {
    const [open, browse, soon] = toShopTiles([card("a", "active"), card("b", "active"), card("c", "coming_soon")], orderable);
    expect(open.state).toBe("open");
    expect(browse.state).toBe("browse_only");
    expect(soon.state).toBe("coming_soon");
  });
  it("treats coming_soon as soon even when orderable", () => {
    expect(toShopTiles([card("a", "coming_soon")], orderable)[0].state).toBe("coming_soon");
  });
  it("builds href and Gurusamy meta line", () => {
    const [t] = toShopTiles([card("gurusamy-fireworks", "active", 312, 40)], orderable);
    expect(t.href).toBe("/s/gurusamy-fireworks");
    expect(tileMetaLine(t)).toBe("312 items · Factory-direct retail");
  });
  it("uses the discount badge for other shops and omits it at 0%", () => {
    const [a, b] = toShopTiles([card("a", "active", 240, 70), card("b", "active", 5, 0)], orderable);
    expect(tileMetaLine(a)).toBe("240 items · Upto 80% Off");
    expect(tileMetaLine(b)).toBe("5 items");
  });
});
