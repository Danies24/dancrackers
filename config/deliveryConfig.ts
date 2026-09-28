/**
 * Per-shop packaging/delivery rules — the single place these vary by shop.
 * Everything else (lib/pricing.ts, lib/cart-progress.ts, the cart/enquiry
 * pages, the WhatsApp/email messages, and the static legal pages) reads
 * through getShopDeliveryConfig() instead of hardcoding a number.
 *
 * Sri Ram and Bullet intentionally carry today's brandConfig.cartCharges
 * values unchanged — only Gurusamy's economics are new here (no packaging
 * charge ever, a flat delivery charge that is never waived).
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
 * Wholesale factory-direct model: no packaging charge at all, and delivery
 * is a flat charge on every order — never waived, regardless of order value.
 */
const GURUSAMY_DELIVERY_CONFIG: ShopDeliveryConfig = {
  packaging: { enabled: false, percent: 0, waiverThreshold: 0 },
  delivery: { flatCharge: 400, freeThreshold: null },
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
