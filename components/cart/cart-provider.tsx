"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type CartItem,
  type CartShop,
  type CartState,
  addItem,
  cartShopConflicts,
  clearCart,
  decrementItem,
  emptyCart,
  incrementItem,
  parseCart,
  removeItem,
  serializeCart,
  setItemQty,
} from "@/lib/cart";
import { StartNewCartSheet } from "@/components/cart/start-new-cart-sheet";

const STORAGE_KEY = "dc_cart";

export interface PendingShopSwitch {
  item: { productId: string; sku: string; price: number };
  qty: number;
  shop: CartShop;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  shopId: string | null;
  shopSlug: string | null;
  shopName: string | null;
  storageAvailable: boolean;
  hydrated: boolean;
  /** Returns "added" when the item went straight in, or "pending" when a different shop's items were already in the cart — the confirm sheet is now showing and nothing was added yet. */
  add: (item: { productId: string; sku: string; price: number }, qty: number | undefined, shop: CartShop) => "added" | "pending";
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  /**
   * Loads several items from `shop` in one atomic update — used by the
   * shared-cart "Load into my cart" flow, which has already resolved any
   * shop conflict itself (a confirm dialog, not the add()/StartNewCartSheet
   * pending flow) before calling this. "replace" starts from an empty cart;
   * "merge" adds onto whatever's already there, summing quantities on any
   * overlapping productId (addItem's existing behaviour). A single apply()
   * call, so it never races add()'s stateRef-based conflict check the way
   * looping add() calls after clear() would.
   */
  loadItems: (
    items: Array<{ productId: string; sku: string; price: number; qty: number }>,
    shop: CartShop,
    mode: "merge" | "replace",
  ) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(() => emptyCart());
  // Mirrors `state` for `add()` to read synchronously without needing
  // `state` itself in its dependency array — updated in an effect (never
  // during render, which React disallows mutating a ref in).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const [hydrated, setHydrated] = useState(false);
  const storageAvailableRef = useRef(true);
  const [storageAvailable, setStorageAvailableState] = useState(true);
  const [pending, setPending] = useState<PendingShopSwitch | null>(null);
  const scrollYRef = useRef(0);

  const setStorageAvailable = useCallback((v: boolean) => {
    storageAvailableRef.current = v;
    setStorageAvailableState(v);
  }, []);

  // One place that both updates React state and persists — every mutator below calls this.
  const apply = useCallback(
    (updater: (prev: CartState) => CartState) => {
      setState((prev) => {
        const next = updater(prev);
        if (storageAvailableRef.current) {
          try {
            window.localStorage.setItem(STORAGE_KEY, serializeCart(next));
          } catch {
            setStorageAvailable(false);
          }
        }
        return next;
      });
    },
    [setStorageAvailable],
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setState(parseCart(raw));
    } catch {
      setStorageAvailable(false);
      setState(emptyCart());
    }
    setHydrated(true);
  }, [setStorageAvailable]);

  const add = useCallback(
    (item: { productId: string; sku: string; price: number }, qty = 1, shop: CartShop): "added" | "pending" => {
      if (cartShopConflicts(stateRef.current, shop.id)) {
        // Multi-shop spec §6: "Keep current cart" must leave the page
        // scrolled where it was — remembered here since the sheet itself
        // causes no navigation, only this pending state.
        scrollYRef.current = window.scrollY;
        setPending({ item, qty, shop });
        return "pending";
      }
      apply((prev) => addItem(prev, item, qty, shop));
      return "added";
    },
    [apply],
  );

  const confirmShopSwitch = useCallback(() => {
    if (!pending) return;
    apply(() => addItem(emptyCart(), pending.item, pending.qty, pending.shop));
    setPending(null);
  }, [pending, apply]);

  const cancelShopSwitch = useCallback(() => {
    setPending(null);
    // Restore the scroll position the sheet interrupted (§6 MUST).
    requestAnimationFrame(() => window.scrollTo({ top: scrollYRef.current }));
  }, []);

  const increment = useCallback(
    (productId: string) => apply((prev) => incrementItem(prev, productId)),
    [apply],
  );
  const decrement = useCallback(
    (productId: string) => apply((prev) => decrementItem(prev, productId)),
    [apply],
  );
  const setQty = useCallback(
    (productId: string, qty: number) => apply((prev) => setItemQty(prev, productId, qty)),
    [apply],
  );
  const remove = useCallback(
    (productId: string) => apply((prev) => removeItem(prev, productId)),
    [apply],
  );
  const clear = useCallback(() => apply(() => clearCart()), [apply]);

  const loadItems = useCallback(
    (
      itemsToLoad: Array<{ productId: string; sku: string; price: number; qty: number }>,
      shop: CartShop,
      mode: "merge" | "replace",
    ) => {
      apply((prev) => {
        const base = mode === "replace" ? emptyCart() : prev;
        return itemsToLoad.reduce(
          (acc, item) => addItem(acc, { productId: item.productId, sku: item.sku, price: item.price }, item.qty, shop),
          base,
        );
      });
    },
    [apply],
  );

  const itemCount = useMemo(
    () => (hydrated ? state.items.reduce((sum, i) => sum + i.qty, 0) : 0),
    [state.items, hydrated],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items: hydrated ? state.items : [],
      itemCount,
      shopId: hydrated ? state.shopId : null,
      shopSlug: hydrated ? state.shopSlug : null,
      shopName: hydrated ? state.shopName : null,
      storageAvailable,
      hydrated,
      add,
      increment,
      decrement,
      setQty,
      remove,
      clear,
      loadItems,
    }),
    [state, hydrated, itemCount, storageAvailable, add, increment, decrement, setQty, remove, clear, loadItems],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <StartNewCartSheet
        open={pending !== null}
        currentShopName={state.shopName}
        newShopName={pending?.shop.name ?? ""}
        onKeepCurrent={cancelShopSwitch}
        onClearAndAdd={confirmShopSwitch}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
