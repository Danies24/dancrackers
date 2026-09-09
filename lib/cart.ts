/**
 * Pure cart state operations (PRD §15.1-15.2). No localStorage access here —
 * that lives in the useCart hook — so this file is trivially unit-testable.
 */

export const CART_SCHEMA_VERSION = 1;
export const CART_TTL_DAYS = 30;

export interface CartItem {
  productId: string;
  sku: string;
  qty: number;
  /** Captured at add-time to detect a price change (§15.3). Never used for calculation. */
  priceAtAdd: number;
}

export interface CartState {
  v: number;
  updatedAt: number;
  items: CartItem[];
}

export function emptyCart(): CartState {
  return { v: CART_SCHEMA_VERSION, updatedAt: Date.now(), items: [] };
}

export function serializeCart(state: CartState): string {
  return JSON.stringify(state);
}

/**
 * Parses a stored cart, recovering to an empty cart on corrupt JSON, a
 * schema version mismatch, or an expired TTL (§15.1, §39.1).
 */
export function parseCart(raw: string | null | undefined): CartState {
  if (!raw) return emptyCart();
  try {
    const parsed = JSON.parse(raw) as Partial<CartState>;
    if (parsed?.v !== CART_SCHEMA_VERSION || !Array.isArray(parsed.items)) {
      return emptyCart();
    }
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
    return { v: CART_SCHEMA_VERSION, updatedAt: parsed.updatedAt ?? Date.now(), items };
  } catch {
    return emptyCart();
  }
}

function touch(state: CartState, items: CartItem[]): CartState {
  return { v: CART_SCHEMA_VERSION, updatedAt: Date.now(), items };
}

/** Adds a product, or increments its line if already present (§15.2 "Add"). */
export function addItem(
  state: CartState,
  item: { productId: string; sku: string; price: number },
  qty = 1,
): CartState {
  const existing = state.items.find((i) => i.productId === item.productId);
  if (existing) {
    return setItemQty(state, item.productId, existing.qty + qty);
  }
  return touch(state, [
    ...state.items,
    { productId: item.productId, sku: item.sku, qty: Math.max(1, qty), priceAtAdd: item.price },
  ]);
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
