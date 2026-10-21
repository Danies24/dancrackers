import { isGurusamyShop } from "@/config/deliveryConfig";
import { getShopDiscountBadgeText } from "@/lib/shop-marketing";

export type ShopTileState = "open" | "browse_only" | "coming_soon";

export interface ShopTile {
  slug: string;
  nameEn: string;
  nameTa: string | null;
  logoUrl: string | null;
  /** Gradient token pair for the tile fill — slug-keyed, since shops has no accent column. */
  accent: { from: string; to: string };
  state: ShopTileState;
  productCount: number;
  maxDiscountPercent: number;
  /** The tile's meta-line suffix ("Factory-direct retail", "Upto 80% Off"), or null. */
  badge: string | null;
  href: string;
}

/** Minimal shape of a picker card — satisfied by lib/shops.ts's ShopPickerCard and ShopShowcaseCard. */
export interface ShopTileInput {
  shop: { slug: string; name_en: string; name_ta: string | null; logo_url: string | null; status: string };
  productCount: number;
  maxDiscountPercent: number;
}

const ACCENTS: Record<string, { from: string; to: string }> = {
  "gurusamy-fireworks": { from: "var(--gold)", to: "var(--maroon)" },
  "sri-ram-crackers": { from: "var(--maroon)", to: "var(--pink)" },
};
const DEFAULT_ACCENT = { from: "var(--maroon)", to: "var(--pink)" };

export function toShopTiles(
  cards: ShopTileInput[],
  isOrderable: (slug: string) => boolean,
): ShopTile[] {
  return cards.map(({ shop, productCount, maxDiscountPercent }) => {
    const state: ShopTileState =
      shop.status === "coming_soon" ? "coming_soon" : isOrderable(shop.slug) ? "open" : "browse_only";
    const badge = isGurusamyShop(shop.slug)
      ? "Factory-direct retail"
      : maxDiscountPercent > 0
        ? getShopDiscountBadgeText(shop.slug, maxDiscountPercent)
        : null;
    return {
      slug: shop.slug,
      nameEn: shop.name_en,
      nameTa: shop.name_ta,
      logoUrl: shop.logo_url,
      accent: ACCENTS[shop.slug] ?? DEFAULT_ACCENT,
      state,
      productCount,
      maxDiscountPercent,
      badge,
      href: `/s/${shop.slug}`,
    };
  });
}

export function tileMetaLine(tile: ShopTile): string {
  if (tile.state === "coming_soon") return "Opening soon";
  return [`${tile.productCount} items`, tile.badge].filter(Boolean).join(" · ");
}
