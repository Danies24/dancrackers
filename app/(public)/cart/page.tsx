"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { useValidatedCart } from "@/components/cart/use-validated-cart";
import { ReferralCodeField } from "@/components/cart/referral-code-field";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { formatRupees, formatUnit } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { brandConfig } from "@/config/brandConfig";

/** Mirrors the real cart line-item layout below, so the initial load doesn't jump. */
function CartLineSkeleton() {
  return (
    <div className="flex gap-3 p-3">
      <Skeleton className="h-14 w-14 shrink-0 rounded-md" />
      <div className="flex-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/3" />
        <div className="mt-3 flex items-center justify-between">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, setQty, remove } = useCart();
  // The delivery state (and so the exact ₹3,000/₹5,000 threshold) isn't known
  // until the enquiry form, where the real gate is enforced client- and
  // server-side. Here we only gate on the lower of the two — ₹3,000 — so a
  // cart that can't possibly clear the minimum for ANY state never lets the
  // customer proceed; a Tamil Nadu order can still be blocked on the next
  // step once their state confirms the ₹5,000 floor doesn't apply to them.
  const { loading, activeLines, unavailableLines, totals } = useValidatedCart();
  const belowFloor = totals.grandTotal < brandConfig.orderMinimums.tamilNadu;

  useEffect(() => {
    if (!loading && items.length > 0) {
      trackEvent("cart_view", { item_count: items.length, cart_value: totals.grandTotal });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (items.length === 0 && !loading) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-maroon-tint text-3xl">🛒</div>
        <h1 className="font-display text-xl font-semibold text-ink">Your cart is empty</h1>
        <Link href="/products">
          <Button>Browse Crackers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-40 md:pb-6">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Your Order <span className="text-base font-normal text-muted">({items.length} items)</span>
      </h1>

      {loading ? (
        <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-surface">
          {items.map((i) => (
            <CartLineSkeleton key={i.productId} />
          ))}
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-surface">
          {activeLines.map((line) => {
            const v = line.validated!;
            const priceChanged = v.price !== line.priceAtAdd;
            return (
              <div key={line.productId} className="flex gap-3 p-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-cream">
                  {v.image_url ? (
                    <Image src={v.image_url} alt={v.name_en ?? ""} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display font-semibold text-maroon-ink">
                      {v.name_en?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{v.name_en}</p>
                  {v.name_ta && (
                    <p lang="ta" className="text-xs text-muted">
                      {v.name_ta}
                    </p>
                  )}
                  <p className="tabular-nums text-xs text-muted">
                    {formatRupees(v.price!)} per {formatUnit(v.unit ?? "")}
                  </p>
                  {priceChanged && (
                    <p className="mt-1 text-xs text-amber-ink">Price updated since you added this item.</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <Stepper
                      value={line.qty}
                      onIncrement={() => setQty(line.productId, line.qty + 1)}
                      onDecrement={() => setQty(line.productId, line.qty - 1)}
                      label={v.name_en ?? "item"}
                    />
                    <span className="tabular-nums text-sm font-bold text-ink">
                      {formatRupees(v.price! * line.qty)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(line.productId)}
                  aria-label={`Remove ${v.name_en}`}
                  className="self-start text-muted hover:text-red-ink"
                >
                  ✕
                </button>
              </div>
            );
          })}

          {unavailableLines.map((line) => (
            <div key={line.productId} className="flex items-center justify-between gap-3 p-3 opacity-60">
              <div>
                <p className="text-sm font-semibold text-ink line-through">
                  {line.validated?.name_en ?? "Product"}
                </p>
                <p className="text-xs text-red-ink">No longer available</p>
              </div>
              <button
                type="button"
                onClick={() => remove(line.productId)}
                className="text-xs font-semibold text-maroon-ink"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && activeLines.length > 0 && (
        <>
          <div className="mt-6 rounded-lg border border-border bg-surface p-4">
            {totals.netRateSubtotal > 0 && totals.discountableSubtotal > 0 && (
              <>
                <Row label="Discountable items" value={totals.discountableSubtotal} muted />
                <Row label="Net-rate items (no discount)" value={totals.netRateSubtotal} muted />
              </>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <span className="font-semibold text-ink">Total</span>
              <span className="tabular-nums text-2xl font-bold text-ink">{formatRupees(totals.grandTotal)}</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted">
            {belowFloor ? (
              <span className="font-semibold text-maroon-ink">
                Add {formatRupees(brandConfig.orderMinimums.tamilNadu - totals.grandTotal)} more to reach the ₹
                {brandConfig.orderMinimums.tamilNadu.toLocaleString("en-IN")} minimum order.
              </span>
            ) : (
              <>
                Minimum order ₹3,000 (Tamil Nadu) / ₹5,000 (other states) — confirmed on the next step. Orders under
                ₹5,000 are collected from the nearest parcel office.
              </>
            )}
          </p>

          <ReferralCodeField />

          <div
            className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-4 md:static md:mt-6 md:border-0 md:bg-transparent md:p-0"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
          >
            {belowFloor ? (
              <Button size="full" disabled>
                Continue to Enquiry →
              </Button>
            ) : (
              <Link
                href="/enquiry"
                onClick={() => trackEvent("begin_enquiry", { cart_value: totals.grandTotal, item_count: items.length })}
              >
                <Button size="full">Continue to Enquiry →</Button>
              </Link>
            )}
            <p className="mt-2 text-center text-xs text-ink-soft">
              No payment on this site. We will call you to confirm before anything is charged.
            </p>
          </div>

          <Link href="/products" className="mt-4 inline-block text-sm font-semibold text-maroon-ink">
            ← Add more items
          </Link>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  strike,
  className,
}: {
  label: string;
  value: number;
  muted?: boolean;
  strike?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex justify-between py-0.5 text-sm ${muted ? "text-muted" : "text-ink-soft"} ${className ?? ""}`}>
      <span>{label}</span>
      <span className={`tabular-nums ${strike ? "line-through" : ""}`}>
        {value < 0 ? `-${formatRupees(-value)}` : formatRupees(value)}
      </span>
    </div>
  );
}
