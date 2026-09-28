"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { CartShop } from "@/lib/cart";

interface SharedLine {
  productId: string;
  sku: string;
  price: number;
  qty: number;
}

/**
 * "Load into my cart" / "Send enquiry" for /cart/shared. An empty visitor
 * cart loads straight away; a non-empty one asks merge-vs-replace (same
 * shop) or confirms starting a new cart (different shop, one-shop-per-cart
 * rule) before loading — via CartProvider's atomic loadItems(), not add(),
 * so it never fights the pending-conflict sheet.
 */
export function SharedCartActions({ shop, lines }: { shop: CartShop; lines: SharedLine[] }) {
  const router = useRouter();
  const { items, shopId, loadItems } = useCart();
  const { show } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"load" | "enquiry" | null>(null);

  const isEmpty = items.length === 0;
  const sameShop = !isEmpty && shopId === shop.id;

  function finish(mode: "merge" | "replace", action: "load" | "enquiry") {
    loadItems(lines, shop, mode);
    setConfirmOpen(false);
    setPendingAction(null);
    if (action === "enquiry") {
      router.push("/enquiry");
    } else {
      show("Loaded into your cart!");
    }
  }

  function startAction(action: "load" | "enquiry") {
    if (isEmpty) {
      finish("replace", action);
      return;
    }
    setPendingAction(action);
    setConfirmOpen(true);
  }

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <div className="mx-auto flex max-w-3xl gap-2">
          <Button size="full" variant="secondary" onClick={() => startAction("load")}>
            Load into my cart
          </Button>
          <Button size="full" onClick={() => startAction("enquiry")}>
            Send enquiry →
          </Button>
        </div>
      </div>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} ariaLabel="Load shared cart">
        <div className="p-6">
          {sameShop ? (
            <>
              <h2 className="font-display text-lg font-semibold text-ink">Merge or replace?</h2>
              <p className="mt-3 text-sm text-ink-soft">
                You already have items from {shop.name} in your cart. Add this shared list on top, or replace your
                cart with it?
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Button size="full" onClick={() => pendingAction && finish("merge", pendingAction)}>
                  Merge quantities
                </Button>
                <Button size="full" variant="secondary" onClick={() => pendingAction && finish("replace", pendingAction)}>
                  Replace my cart
                </Button>
                <Button size="full" variant="ghost" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-display text-lg font-semibold text-ink">Start a new cart?</h2>
              <p className="mt-3 text-sm text-ink-soft">
                Your cart has items from another shop. Loading this shared cart will clear it and start a cart from{" "}
                <strong>{shop.name}</strong>.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Button size="full" onClick={() => pendingAction && finish("replace", pendingAction)}>
                  Clear and load
                </Button>
                <Button size="full" variant="ghost" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </Sheet>
    </>
  );
}
