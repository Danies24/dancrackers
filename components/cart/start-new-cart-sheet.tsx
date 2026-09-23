"use client";

import { Button } from "@/components/ui/button";

/**
 * The one-shop-per-cart confirm sheet (multi-shop spec §6) — shown when
 * adding an item would clear an existing cart from a different shop.
 * "Keep current cart" is the default (closing does nothing destructive);
 * "Clear and add" empties the cart and adds the new item from the new shop.
 */
export function StartNewCartSheet({
  open,
  currentShopName,
  newShopName,
  onKeepCurrent,
  onClearAndAdd,
}: {
  open: boolean;
  currentShopName: string | null;
  newShopName: string;
  onKeepCurrent: () => void;
  onClearAndAdd: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 md:items-center" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-new-cart-title"
        className="w-full max-w-md rounded-t-3xl border border-border bg-surface p-6 shadow-lg md:rounded-3xl"
      >
        <h2 id="start-new-cart-title" className="font-display text-lg font-semibold text-ink">
          புதிய கடையிலிருந்து ஆர்டர் செய்யவா? / Start a new cart?
        </h2>
        <p className="mt-3 text-sm text-ink-soft">
          உங்கள் கார்ட்டில் {currentShopName ?? "another shop"} பொருட்கள் உள்ளன. {newShopName} பொருளைச் சேர்த்தால் பழைய
          கார்ட் அழிக்கப்படும்.
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Your cart has items from <strong>{currentShopName ?? "another shop"}</strong>. Adding this will clear it and
          start a cart from <strong>{newShopName}</strong>.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button size="full" variant="secondary" onClick={onKeepCurrent} autoFocus>
            Keep current cart
          </Button>
          <Button size="full" variant="ghost" onClick={onClearAndAdd}>
            Clear and add
          </Button>
        </div>
      </div>
    </div>
  );
}
