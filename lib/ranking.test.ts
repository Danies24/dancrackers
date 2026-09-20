import { describe, expect, it } from "vitest";
import { rankProducts, hasRealImage, isBestProduct, type RankableProduct } from "./ranking";

describe("hasRealImage", () => {
  it("returns true for valid image URL", () => {
    expect(hasRealImage({ image_url: "https://example.com/img.jpg" })).toBe(true);
    expect(hasRealImage({ image_url: "/uploads/product.webp" })).toBe(true);
  });

  it("returns false for null, empty, whitespace, or placeholder URL", () => {
    expect(hasRealImage({ image_url: null })).toBe(false);
    expect(hasRealImage({ image_url: undefined })).toBe(false);
    expect(hasRealImage({ image_url: "" })).toBe(false);
    expect(hasRealImage({ image_url: "   " })).toBe(false);
    expect(hasRealImage({ image_url: "/images/placeholder.png" })).toBe(false);
    expect(hasRealImage({ image_url: "https://placehold.co/400" })).toBe(false);
  });
});

describe("isBestProduct", () => {
  it("checks is_best or is_featured", () => {
    expect(isBestProduct({ is_best: true })).toBe(true);
    expect(isBestProduct({ is_featured: true })).toBe(true);
    expect(isBestProduct({ is_best: false, is_featured: false })).toBe(false);
    expect(isBestProduct({})).toBe(false);
  });
});

describe("rankProducts", () => {
  it("sorts strictly in 4 tiers: [img+best] > [img+not_best] > [no_img+best] > [no_img+not_best]", () => {
    const products: RankableProduct[] = [
      { name_en: "D_NoImg_NoBest", image_url: null, is_best: false, display_order: 1 },
      { name_en: "B_Img_NoBest", image_url: "/img.jpg", is_best: false, display_order: 1 },
      { name_en: "C_NoImg_Best", image_url: null, is_best: true, display_order: 1 },
      { name_en: "A_Img_Best", image_url: "/img.jpg", is_best: true, display_order: 1 },
    ];

    const ranked = rankProducts(products);
    expect(ranked.map((p) => p.name_en)).toEqual([
      "A_Img_Best",
      "B_Img_NoBest",
      "C_NoImg_Best",
      "D_NoImg_NoBest",
    ]);
  });

  it("breaks ties within a tier by display_order ascending, then name ascending", () => {
    const products: RankableProduct[] = [
      { name_en: "Zebra", image_url: "/img.jpg", is_best: true, display_order: 5 },
      { name_en: "Apple", image_url: "/img.jpg", is_best: true, display_order: 10 },
      { name_en: "Banana", image_url: "/img.jpg", is_best: true, display_order: 5 },
    ];

    const ranked = rankProducts(products);
    expect(ranked.map((p) => p.name_en)).toEqual(["Banana", "Zebra", "Apple"]);
  });

  it("does not mutate the original array", () => {
    const products: RankableProduct[] = [
      { name_en: "B", image_url: "/img.jpg", is_best: true, display_order: 2 },
      { name_en: "A", image_url: "/img.jpg", is_best: true, display_order: 1 },
    ];
    const original = [...products];
    rankProducts(products);
    expect(products).toEqual(original);
  });
});
