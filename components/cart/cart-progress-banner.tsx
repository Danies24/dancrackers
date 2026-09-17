"use client";

import { getCartProgress } from "@/lib/cart-progress";
import { SparklerIcon } from "@/components/marketing/sparkler-icon";
import { CrackerBurst } from "@/components/cart/cracker-burst";
import { useCartMilestoneCelebration } from "@/components/cart/use-cart-milestone-celebration";

/**
 * The strip shown directly above the site-wide sticky "View Cart" bar
 * (components/cart/sticky-cart-bar.tsx) — same festive glow/gradient/spark
 * vocabulary as the homepage hero (components/marketing/spark-field.tsx), so
 * it reads as one system rather than a bolted-on banner. Shares its
 * milestone math with the /cart page's thin CartProgressBar via
 * lib/cart-progress.ts. The bar itself only ever *transitions* width in the
 * background glow — the only animation that plays is the one-shot cracker
 * blast, fired exactly when `subtotal` newly crosses ₹2,999 / ₹3,499 /
 * ₹3,999 (use-cart-milestone-celebration.ts), never on a loop.
 */
export function CartProgressBanner({ subtotal }: { subtotal: number }) {
  const progress = getCartProgress(subtotal);
  const fillPercent = progress.done ? 100 : Math.max(progress.progressPercent, 6);
  const celebration = useCartMilestoneCelebration(subtotal);

  return (
    <div className="relative overflow-hidden border-b border-border bg-cream px-4 pb-2.5 pt-3">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span
          className="absolute -top-8 left-4 h-20 w-20 animate-pulse rounded-full blur-2xl"
          style={{ background: "var(--glow-orange)", animationDuration: "5s" }}
        />
        <span
          className="absolute -bottom-10 right-8 h-24 w-24 animate-pulse rounded-full blur-2xl"
          style={{ background: "var(--glow-pink)", animationDuration: "6s", animationDelay: "1s" }}
        />
      </div>

      <div className="relative mx-auto flex max-w-3xl items-center gap-2.5">
        <SparklerIcon size={22} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-gradient-festival md:text-sm">
            {celebration
              ? `🎉 ${celebration.label}`
              : progress.done
                ? "You've unlocked zero packaging & free delivery! 🎉"
                : progress.message}
          </p>
          <div className="relative mt-1.5">
            <div
              className="relative h-[10px] w-full overflow-hidden rounded-full bg-white shadow-inner"
              role="progressbar"
              aria-valuenow={progress.done ? 100 : Math.round(progress.progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={progress.done ? "All cart milestones unlocked" : progress.tag}
            >
              <div
                className="h-full rounded-full bg-gradient-primary transition-[width] duration-700 ease-in-out"
                style={{ width: `${fillPercent}%` }}
              />
              <span
                className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-700 ease-in-out"
                style={{ left: `${fillPercent}%` }}
              >
                <SparklerIcon size={16} />
              </span>
            </div>
            {celebration && (
              <div key={celebration.key} className="animate-blast-ring absolute inset-0 rounded-full">
                <CrackerBurst />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
