"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { formatRupees } from "@/lib/format";
import { computeTotals } from "@/lib/pricing";
import { CartProgressBanner } from "@/components/cart/cart-progress-banner";
import { GurusamyDeliveryNotice } from "@/components/cart/gurusamy-delivery-notice";
import { isGurusamyShop } from "@/config/deliveryConfig";
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
  const { items, itemCount, hydrated, shopSlug } = useCart();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const hideOn = ["/cart", "/enquiry", "/admin"];
  if (!mounted || !hydrated) return null;
  if (itemCount === 0) return null;
  if (hideOn.some((p) => pathname?.startsWith(p))) return null;

  const totals = computeTotals(
    items.map((i) => ({ price: i.priceAtAdd, quantity: i.qty, isDiscountable: true })),
    shopSlug,
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-30" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {isGurusamyShop(shopSlug) ? (
        <div className="border-b border-border bg-cream px-4 py-2">
          <GurusamyDeliveryNotice subtotal={totals.subtotal} compact />
        </div>
      ) : (
        <CartProgressBanner subtotal={totals.subtotal} shopSlug={shopSlug} />
      )}
      {/* pr-20 keeps "View Cart" clear of the floating WhatsApp button (fixed
          bottom-right, z-50 — components/layout/floating-whatsapp.tsx), which
          otherwise sits on top of this edge-to-edge bar's right edge. This bar
          has no max-width container to fall back on for clearance, unlike
          /cart's and /cart/shared's bottom bars. */}
      <div className="flex h-16 items-center justify-between bg-maroon px-4 pr-20 text-white shadow-lg">
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
