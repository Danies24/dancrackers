/**
 * Per-shop packaging/delivery rules — the single place these vary by shop.
 * Everything else (lib/pricing.ts, lib/cart-progress.ts, the cart/enquiry
 * pages, the WhatsApp/email messages, and the static legal pages) reads
 * through getShopDeliveryConfig() instead of hardcoding a number.
 *
 * Sri Ram and Bullet intentionally carry today's brandConfig.cartCharges
 * values unchanged — only Gurusamy's packaging is different (no packaging
 * charge at all, still no delivery charge — see below).
 *
 * Delivery is a flat 0 for every shop, by business decision: no shop on
 * this site charges for delivery, so `delivery.flatCharge` is 0 across the
 * board and `freeThreshold` is unused (kept so a future re-introduction of
 * a real delivery charge only needs a number changed here, nothing
 * structural).
 */
import { brandConfig } from "@/config/brandConfig";

export interface ShopDeliveryConfig {
  packaging: {
    enabled: boolean;
    /** Percent of subtotal, only meaningful when enabled. */
    percent: number;
    /** Subtotal at/above which packaging is waived. Only meaningful when enabled. */
    waiverThreshold: number;
  };
  delivery: {
    flatCharge: number;
    /** Subtotal at/above which delivery is free. null = never free (always flatCharge). */
    freeThreshold: number | null;
  };
}

const DEFAULT_DELIVERY_CONFIG: ShopDeliveryConfig = {
  packaging: {
    enabled: true,
    percent: brandConfig.cartCharges.packagingChargePercent,
    waiverThreshold: brandConfig.cartCharges.packagingChargeWaiverThreshold,
  },
  delivery: {
    flatCharge: brandConfig.cartCharges.deliveryCharge,
    freeThreshold: brandConfig.cartCharges.deliveryChargeWaiverThreshold,
  },
};

/**
 * Wholesale factory-direct model: no packaging charge at all. Delivery is
 * 0 here too, same as every other shop — see the file-level comment above.
 */
const GURUSAMY_DELIVERY_CONFIG: ShopDeliveryConfig = {
  packaging: { enabled: false, percent: 0, waiverThreshold: 0 },
  delivery: { flatCharge: 0, freeThreshold: null },
};

export const SHOP_DELIVERY_CONFIG: Record<string, ShopDeliveryConfig> = {
  "sri-ram-crackers": DEFAULT_DELIVERY_CONFIG,
  "gurusamy-fireworks": GURUSAMY_DELIVERY_CONFIG,
  "bullet-crackers": DEFAULT_DELIVERY_CONFIG,
};

/** Unknown/null shop slug (e.g. an empty cart before a shop is known) falls back to the default rules. */
export function getShopDeliveryConfig(shopSlug: string | null | undefined): ShopDeliveryConfig {
  if (shopSlug && SHOP_DELIVERY_CONFIG[shopSlug]) return SHOP_DELIVERY_CONFIG[shopSlug];
  return DEFAULT_DELIVERY_CONFIG;
}

export function isGurusamyShop(shopSlug: string | null | undefined): boolean {
  return shopSlug === "gurusamy-fireworks";
}
