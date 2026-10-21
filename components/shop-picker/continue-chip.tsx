"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { LAST_SHOP_KEY, chooseContinueShop, parseLastShop, type ContinueShop } from "@/lib/last-shop";
import { trackEvent } from "@/lib/analytics";

function subscribeStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}
function readRaw(): string | null {
  try {
    return window.localStorage.getItem(LAST_SHOP_KEY);
  } catch {
    return null;
  }
}

/**
 * Which shop to highlight. localStorage is read only after mount (via an
 * effect), so the server HTML and the first client render both see `null`.
 */
export function useContinueShop(): ContinueShop | null {
  const cart = useCart();
  // Server snapshot is null, so SSR and the first client render match.
  const raw = useSyncExternalStore(subscribeStorage, readRaw, () => null);
  const last = parseLastShop(raw);
  if (!cart.hydrated) return null;
  return chooseContinueShop({ shopSlug: cart.shopSlug, shopName: cart.shopName, itemCount: cart.itemCount }, last);
}

export function ContinueChip({ target }: { target: ContinueShop }) {
  return (
    <Link
      href={`/s/${target.slug}`}
      onClick={() => trackEvent("shop_picker_continue", { shop: target.slug, source: target.source })}
      className="mx-auto mb-6 flex max-w-sm items-center justify-between gap-3 rounded-2xl border border-gold bg-white/10 px-4 py-3 text-white"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">Continue in {target.name}</span>
        <span className="block text-xs text-white/70">
          {target.source === "cart"
            ? `${target.itemCount} ${target.itemCount === 1 ? "item" : "items"} in your cart`
            : "Last visited"}
        </span>
      </span>
      <ArrowRight size={18} aria-hidden className="shrink-0 text-gold" />
    </Link>
  );
}
