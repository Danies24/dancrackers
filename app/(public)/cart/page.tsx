"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { useValidatedCart } from "@/components/cart/use-validated-cart";
import { ReferralCodeField } from "@/components/cart/referral-code-field";
import { CartProgressBar } from "@/components/cart/cart-progress-bar";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { formatRupees, formatUnit } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { brandConfig, getPhoneDisplay, getPhoneE164, getWhatsAppLink } from "@/config/brandConfig";
import { getOrderDeadlineStatus, isOrderDeadlineBlocked } from "@/lib/order-deadline";

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
  const { items, setQty, remove, shopSlug, shopName } = useCart();
  const { loading, activeLines, unavailableLines, totals, belowMinimum } = useValidatedCart();

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
    <div className="mx-auto max-w-3xl px-4 py-6 pb-52 md:pb-6">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Your Order <span className="text-base font-normal text-muted">({items.length} items)</span>
      </h1>
      {shopSlug && shopName && (
        <Link href={`/s/${shopSlug}`} className="mt-1 inline-block text-sm font-medium text-maroon-ink hover:underline">
          from {shopName} →
        </Link>
      )}

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
                <Link href={`/s/${v.shopSlug}/p/${v.slug}`} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-cream">
                  {v.image_url ? (
                    <Image src={v.image_url} alt={v.name_en ?? ""} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display font-semibold text-maroon-ink">
                      {v.name_en?.charAt(0)}
                    </div>
                  )}
                </Link>
                <div className="flex-1">
                  <Link href={`/s/${v.shopSlug}/p/${v.slug}`} className="group block">
                    <p className="text-sm font-semibold text-ink transition-colors group-hover:text-maroon-ink">{v.name_en}</p>
                    {v.name_ta && (
                      <p lang="ta" className="text-xs text-muted">
                        {v.name_ta}
                      </p>
                    )}
                  </Link>
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
            <Row label="Item subtotal" value={totals.subtotal} muted />
            <Row
              label={`Packaging charge (${brandConfig.cartCharges.packagingChargePercent}%)`}
              value={totals.packagingCharge}
              muted={totals.packagingCharge === 0}
              free={totals.packagingCharge === 0}
            />
            <Row
              label="Delivery charge"
              value={totals.deliveryCharge}
              muted={totals.deliveryCharge === 0}
              free={totals.deliveryCharge === 0}
            />
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <span className="font-semibold text-ink">Total</span>
              <span className="tabular-nums text-2xl font-bold text-ink">{formatRupees(totals.grandTotal)}</span>
            </div>
          </div>

          <ReferralCodeField />

          <div
            className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-4 md:static md:mt-6 md:border-0 md:bg-transparent md:p-0"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
          >
            <div className="mb-3">
              <CartProgressBar subtotal={totals.subtotal} />
            </div>
            {isOrderDeadlineBlocked() ? (
              <div className="flex flex-col gap-2">
                <Button size="full" disabled variant="secondary">
                  {brandConfig.orderDeadline.labels.en.closedTitle}
                </Button>
                <div className="flex items-center justify-center gap-3 text-xs">
                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-whatsapp hover:underline"
                  >
                    WhatsApp Us
                  </a>
                  <span className="text-muted">·</span>
                  <a
                    href={`tel:+${getPhoneE164()}`}
                    className="font-semibold text-maroon-ink hover:underline"
                  >
                    Call {getPhoneDisplay()}
                  </a>
                </div>
              </div>
            ) : belowMinimum ? (
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
              {brandConfig.orderDeadline.enabled ? (
                getOrderDeadlineStatus(brandConfig.orderDeadline.iso).isClosed ? (
                  brandConfig.orderDeadline.labels.en.closedReminderText
                ) : (
                  <>
                    <span className="font-semibold text-maroon-ink">
                      {brandConfig.orderDeadline.labels.en.reminderText}
                    </span>
                    <span className="hidden text-muted sm:inline"> · </span>
                    <span className="hidden text-ink-soft sm:inline" lang="ta">
                      {brandConfig.orderDeadline.labels.ta.reminderText}
                    </span>
                  </>
                )
              ) : (
                "No payment on this site. We will call you to confirm before anything is charged."
              )}
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
  free,
  className,
}: {
  label: string;
  value: number;
  muted?: boolean;
  strike?: boolean;
  /** Renders "Free" in teal instead of ₹0 — for a waived packaging/delivery charge. */
  free?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex justify-between py-0.5 text-sm ${muted ? "text-muted" : "text-ink-soft"} ${className ?? ""}`}>
      <span>{label}</span>
      {free ? (
        <span className="tabular-nums font-semibold text-teal-ink">Free</span>
      ) : (
        <span className={`tabular-nums ${strike ? "line-through" : ""}`}>
          {value < 0 ? `-${formatRupees(-value)}` : formatRupees(value)}
        </span>
      )}
    </div>
  );
}
