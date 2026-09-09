"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { findItem } from "@/lib/cart";
import { formatRupees } from "@/lib/format";

interface Props {
  productId: string;
  sku: string;
  price: number;
  name: string;
}

/** §12.4 section 5. Sticky footer on mobile once scrolled past the fold. */
export function ProductDetailActions({ productId, sku, price, name }: Props) {
  const { items, add, setQty } = useCart();
  const { show } = useToast();
  const [qty, setLocalQty] = useState(1);
  const cartItem = findItem({ v: 1, updatedAt: 0, items }, productId);

  function handleAdd() {
    if (cartItem) {
      setQty(productId, cartItem.qty + qty);
      show(`Updated ${name} in cart`);
    } else {
      add({ productId, sku, price }, qty);
      show(`Added ${name} to cart`);
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        {cartItem ? (
          <Stepper
            value={cartItem.qty}
            onIncrement={() => setQty(productId, cartItem.qty + 1)}
            onDecrement={() => setQty(productId, cartItem.qty - 1)}
            label={name}
          />
        ) : (
          <>
            <Stepper value={qty} onIncrement={() => setLocalQty((q) => q + 1)} onDecrement={() => setLocalQty((q) => Math.max(1, q - 1))} label={name} />
            <Button onClick={handleAdd} className="flex-1">
              Add to Cart
            </Button>
          </>
        )}
      </div>

      {/* Sticky mobile action bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3 shadow-lg md:hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <span className="tabular-nums text-lg font-bold text-ink">{formatRupees(price)}</span>
        {cartItem ? (
          <Stepper
            value={cartItem.qty}
            onIncrement={() => setQty(productId, cartItem.qty + 1)}
            onDecrement={() => setQty(productId, cartItem.qty - 1)}
            label={name}
          />
        ) : (
          <Button onClick={handleAdd}>Add to Cart</Button>
        )}
      </div>
    </>
  );
}
