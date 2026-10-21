"use client";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

/**
 * The one-shop-per-cart confirm sheet (multi-shop spec §6) — shown when
 * adding an item would clear an existing cart from a different shop.
 * "Keep my cart" is the default (closing via backdrop/ESC/back-button
 * does nothing destructive — same as an explicit "Keep current cart" tap);
 * "Clear cart & switch" empties the cart and adds the new item from the new shop.
 * First refactor onto the shared Sheet primitive (components/ui/sheet.tsx).
 */
export function StartNewCartSheet({
  open,
  currentShopName,
  newShopName,
  itemCount,
  onKeepCurrent,
  onClearAndAdd,
}: {
  open: boolean;
  currentShopName: string | null;
  newShopName: string;
  itemCount: number;
  onKeepCurrent: () => void;
  onClearAndAdd: () => void;
}) {
  return (
    <Sheet open={open} onClose={onKeepCurrent} ariaLabel={`Start a new cart at ${newShopName}?`}>
      <div className="p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Start a new cart at {newShopName}?</h2>
        <p className="mt-3 text-sm text-ink-soft">
          Your cart has {itemCount} {itemCount === 1 ? "item" : "items"} from{" "}
          <strong>{currentShopName ?? "another shop"}</strong>. A cart holds one shop at a time, so these will be
          removed.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button size="full" variant="dark" onClick={onKeepCurrent}>
            Keep my cart
          </Button>
          <Button size="full" variant="outline-danger" onClick={onClearAndAdd}>
            Clear cart &amp; switch
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
