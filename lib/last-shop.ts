/**
 * "Last visited shop" memory for the shop picker. Pure parse + safe storage
 * wrappers; every storage touch is try/catch (private mode, blocked storage).
 */
export const LAST_SHOP_KEY = "dc_last_shop";
export const LAST_SHOP_VERSION = 1;
export const LAST_SHOP_TTL_DAYS = 45;

export interface LastShop {
  v: number;
  slug: string;
  name: string;
  at: number;
}

export function parseLastShop(raw: string | null | undefined, now = Date.now()): LastShop | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<LastShop> | null;
    if (!p || p.v !== LAST_SHOP_VERSION) return null;
    if (typeof p.slug !== "string" || !p.slug || typeof p.name !== "string" || typeof p.at !== "number") return null;
    if ((now - p.at) / 86_400_000 > LAST_SHOP_TTL_DAYS) return null;
    return { v: LAST_SHOP_VERSION, slug: p.slug, name: p.name, at: p.at };
  } catch {
    return null;
  }
}

export function readLastShop(): LastShop | null {
  try {
    return parseLastShop(window.localStorage.getItem(LAST_SHOP_KEY));
  } catch {
    return null;
  }
}

export function writeLastShop(slug: string, name: string): void {
  try {
    const value: LastShop = { v: LAST_SHOP_VERSION, slug, name, at: Date.now() };
    window.localStorage.setItem(LAST_SHOP_KEY, JSON.stringify(value));
  } catch {
    // storage unavailable — the picker just won't remember
  }
}

export interface ContinueShop {
  slug: string;
  name: string;
  source: "cart" | "last";
  itemCount: number;
}

/** The cart's shop wins when it has items; otherwise the last visited shop. */
export function chooseContinueShop(
  cart: { shopSlug: string | null; shopName: string | null; itemCount: number },
  last: LastShop | null,
): ContinueShop | null {
  if (cart.itemCount > 0 && cart.shopSlug) {
    return { slug: cart.shopSlug, name: cart.shopName ?? last?.name ?? cart.shopSlug, source: "cart", itemCount: cart.itemCount };
  }
  if (last) return { slug: last.slug, name: last.name, source: "last", itemCount: 0 };
  return null;
}
