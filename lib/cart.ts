/**
 * Pure cart state operations (PRD §15.1-15.2). No localStorage access here —
 * that lives in the useCart hook — so this file is trivially unit-testable.
 */

export const CART_SCHEMA_VERSION = 2;
export const CART_TTL_DAYS = 30;

/**
 * Sri Ram's fixed id from the multi-shop migration
 * (supabase/migrations/20260922000001_multi_shop.sql) — stable and safe to
 * hardcode client-side. The only place this constant is needed: migrating a
 * cart saved before the multi-shop schema shipped, back when Sri Ram was
 * the only shop that could possibly be in it (multi-shop spec §6).
 */
export const SRI_RAM_SHOP: CartShop = { id: "00000000-0000-0000-0000-000000000001", slug: "sri-ram-crackers", name: "Sri Ram Crackers" };

export interface CartItem {
  productId: string;
  sku: string;
  qty: number;
  /** Captured at add-time to detect a price change (§15.3). Never used for calculation. */
  priceAtAdd: number;
}

export interface CartShop {
  id: string;
  slug: string;
  name: string;
}

export interface CartState {
  v: number;
  updatedAt: number;
  /**
   * A cart can only hold one shop's items at a time (multi-shop spec §6) —
   * null exactly when items is empty. slug/name are denormalized purely for
   * display (the cart page's shop link, the "start a new cart?" sheet's
   * shop names) — never used for pricing or validation, which always goes
   * back to the server keyed on id.
   */
  shopId: string | null;
  shopSlug: string | null;
  shopName: string | null;
  items: CartItem[];
}

export function emptyCart(): CartState {
  return { v: CART_SCHEMA_VERSION, updatedAt: Date.now(), shopId: null, shopSlug: null, shopName: null, items: [] };
}

export function serializeCart(state: CartState): string {
  return JSON.stringify(state);
}

/**
 * Parses a stored cart, recovering to an empty cart on corrupt JSON, an
 * unrecognized schema version, or an expired TTL (§15.1, §39.1). A v1 cart
 * (pre-multi-shop) is migrated in place to Sri Ram rather than wiped — it
 * necessarily held only Sri Ram items, since no other shop existed yet.
 */
export function parseCart(raw: string | null | undefined): CartState {
  if (!raw) return emptyCart();
  try {
    const parsed = JSON.parse(raw) as (Partial<CartState> & { v?: number }) | null;
    if (!Array.isArray(parsed?.items)) return emptyCart();

    if (parsed.v !== 1 && parsed.v !== CART_SCHEMA_VERSION) return emptyCart();

    const ageDays = (Date.now() - (parsed.updatedAt ?? 0)) / 86_400_000;
    if (ageDays > CART_TTL_DAYS) return emptyCart();

    const items = parsed.items.filter(
      (i): i is CartItem =>
        typeof i?.productId === "string" &&
        typeof i?.sku === "string" &&
        typeof i?.qty === "number" &&
        i.qty > 0 &&
        typeof i?.priceAtAdd === "number",
    );
    if (items.length === 0) return emptyCart();

    const shop = parsed.v === 1 || typeof parsed.shopId !== "string" ? SRI_RAM_SHOP : null;
    return {
      v: CART_SCHEMA_VERSION,
      updatedAt: parsed.updatedAt ?? Date.now(),
      shopId: shop?.id ?? (parsed.shopId as string),
      shopSlug: shop?.slug ?? (typeof parsed.shopSlug === "string" ? parsed.shopSlug : null),
      shopName: shop?.name ?? (typeof parsed.shopName === "string" ? parsed.shopName : null),
      items,
    };
  } catch {
    return emptyCart();
  }
}

function touch(state: CartState, items: CartItem[], shop?: CartShop | null): CartState {
  if (items.length === 0) {
    return { v: CART_SCHEMA_VERSION, updatedAt: Date.now(), shopId: null, shopSlug: null, shopName: null, items };
  }
  return {
    v: CART_SCHEMA_VERSION,
    updatedAt: Date.now(),
    shopId: shop?.id ?? state.shopId,
    shopSlug: shop?.slug ?? state.shopSlug,
    shopName: shop?.name ?? state.shopName,
    items,
  };
}

/**
 * True when adding an item from `shop` would clear an existing cart from a
 * different shop (multi-shop spec §6) — the caller checks this BEFORE
 * calling addItem, to decide whether to show the "start a new cart?"
 * confirm sheet instead of adding directly. addItem itself trusts the
 * caller already resolved any conflict (e.g. by clearing the cart first).
 */
export function cartShopConflicts(state: CartState, shopId: string): boolean {
  return state.items.length > 0 && state.shopId !== null && state.shopId !== shopId;
}

/** Adds a product, or increments its line if already present (§15.2 "Add"). */
export function addItem(
  state: CartState,
  item: { productId: string; sku: string; price: number },
  qty: number,
  shop: CartShop,
): CartState {
  const existing = state.items.find((i) => i.productId === item.productId);
  if (existing) {
    return setItemQty(state, item.productId, existing.qty + qty);
  }
  return touch(
    state,
    [...state.items, { productId: item.productId, sku: item.sku, qty: Math.max(1, qty), priceAtAdd: item.price }],
    shop,
  );
}

/** Sets a line's quantity directly. Non-positive quantity removes the line (§15.2). */
export function setItemQty(state: CartState, productId: string, qty: number): CartState {
  if (qty <= 0) {
    return removeItem(state, productId);
  }
  return touch(
    state,
    state.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
  );
}

export function incrementItem(state: CartState, productId: string): CartState {
  const existing = state.items.find((i) => i.productId === productId);
  if (!existing) return state;
  return setItemQty(state, productId, existing.qty + 1);
}

export function decrementItem(state: CartState, productId: string): CartState {
  const existing = state.items.find((i) => i.productId === productId);
  if (!existing) return state;
  return setItemQty(state, productId, existing.qty - 1);
}

export function removeItem(state: CartState, productId: string): CartState {
  return touch(
    state,
    state.items.filter((i) => i.productId !== productId),
  );
}

export function clearCart(): CartState {
  return emptyCart();
}

export function findItem(state: CartState, productId: string): CartItem | undefined {
  return state.items.find((i) => i.productId === productId);
}

export function isEmpty(state: CartState): boolean {
  return state.items.length === 0;
}
