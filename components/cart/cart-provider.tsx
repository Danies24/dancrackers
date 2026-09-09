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
  type CartState,
  addItem,
  clearCart,
  decrementItem,
  emptyCart,
  incrementItem,
  parseCart,
  removeItem,
  serializeCart,
  setItemQty,
} from "@/lib/cart";

const STORAGE_KEY = "dc_cart";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  storageAvailable: boolean;
  hydrated: boolean;
  add: (item: { productId: string; sku: string; price: number }, qty?: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(() => emptyCart());
  const [hydrated, setHydrated] = useState(false);
  const storageAvailableRef = useRef(true);
  const [storageAvailable, setStorageAvailableState] = useState(true);

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
    (item: { productId: string; sku: string; price: number }, qty = 1) =>
      apply((prev) => addItem(prev, item, qty)),
    [apply],
  );
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

  const itemCount = useMemo(
    () => (hydrated ? state.items.reduce((sum, i) => sum + i.qty, 0) : 0),
    [state.items, hydrated],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items: hydrated ? state.items : [],
      itemCount,
      storageAvailable,
      hydrated,
      add,
      increment,
      decrement,
      setQty,
      remove,
      clear,
    }),
    [state.items, hydrated, itemCount, storageAvailable, add, increment, decrement, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
