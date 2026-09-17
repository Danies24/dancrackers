"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { formatRupees } from "@/lib/format";
import { computeTotals } from "@/lib/pricing";
import { CartProgressBanner } from "@/components/cart/cart-progress-banner";
import { useEffect, useState } from "react";

/**
 * §10.3, §15.6. Visible on catalogue surfaces once the cart is non-empty —
 * the animated CartProgressBanner sits directly above this bar, sharing the
 * same fixed footer, so the customer sees the "add more to unlock X"
 * nudge in the same glance as the price and the View Cart button.
 * "Never disagrees with the summary card by even a rupee" — so both use the
 * exact same lib/pricing.ts computation, fed by priceAtAdd as a fast
 * approximation until the cart page's server revalidation corrects it.
 */
export function StickyCartBar() {
  const { items, itemCount, hydrated } = useCart();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const hideOn = ["/cart", "/enquiry", "/admin"];
  if (!mounted || !hydrated) return null;
  if (itemCount === 0) return null;
  if (hideOn.some((p) => pathname?.startsWith(p))) return null;

  const totals = computeTotals(
    items.map((i) => ({ price: i.priceAtAdd, quantity: i.qty, isDiscountable: true })),
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-30" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <CartProgressBanner subtotal={totals.subtotal} />
      <div className="flex h-16 items-center justify-between bg-maroon px-4 text-white shadow-lg">
        <span className="text-sm font-medium">
          {itemCount} item{itemCount === 1 ? "" : "s"} · {formatRupees(totals.grandTotal)}
        </span>
        <Link href="/cart" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-maroon-ink">
          View Cart →
        </Link>
      </div>
    </div>
  );
}
