"use client";

import { getCartProgress } from "@/lib/cart-progress";
import { CrackerBurst } from "@/components/cart/cracker-burst";
import { useCartMilestoneCelebration } from "@/components/cart/use-cart-milestone-celebration";

/**
 * Swiggy/Zomato-style "add more to unlock X" bar — one bar, one message,
 * always pointed at the next unmet milestone (min order → free packaging →
 * free delivery). Shares its milestone math with the hero banner above the
 * site-wide sticky cart bar (lib/cart-progress.ts), so the two never
 * disagree, and with computeTotals() itself (§ cartCharges). The bar's width
 * transitions smoothly on every change, but the only *animation* — the
 * cracker-blast burst — plays once, exactly when `subtotal` newly crosses a
 * milestone (use-cart-milestone-celebration.ts), never on a loop.
 * `subtotal` is the item subtotal — before packaging/delivery are added.
 */
export function CartProgressBar({ subtotal }: { subtotal: number }) {
  const progress = getCartProgress(subtotal);
  const celebration = useCartMilestoneCelebration(subtotal);

  if (progress.done) {
    return (
      <div className="relative rounded-md bg-teal-tint px-3 py-2 text-xs font-semibold text-teal-ink">
        🎉 {celebration ? celebration.label : "You've unlocked zero packaging & zero delivery charges!"}
        {celebration && (
          <div key={celebration.key} className="animate-blast-ring absolute inset-0 rounded-md">
            <CrackerBurst />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-maroon-ink">
        {celebration ? `🎉 ${celebration.label}` : progress.message}
      </p>
      <div className="relative">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuenow={Math.round(progress.progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-maroon transition-[width] duration-300"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>
        {celebration && (
          <div key={celebration.key} className="animate-blast-ring absolute inset-0 rounded-full">
            <CrackerBurst />
          </div>
        )}
      </div>
    </div>
  );
}
