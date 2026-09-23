"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { ImageWithSkeleton } from "@/components/product/image-with-skeleton";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toast";
import { findItem } from "@/lib/cart";
import { getCartProgress } from "@/lib/cart-progress";
import { formatRupees, formatUnit } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";
import type { ProductWithCategory } from "@/lib/data";

/**
 * The Swiggy-style product quick-view bottom sheet — opened from a
 * ProductCard tap (components/product/product-card.tsx's `onQuickView`
 * prop) with the card's already-fetched product object, no fetch on open.
 * Built on the shared Sheet primitive with `manageHistory={false}`: the
 * caller drives open/close from its own `?item=slug` URL state instead, so
 * only one history entry is pushed per open (see components/ui/sheet.tsx's
 * `manageHistory` prop doc).
 */
export function ProductQuickViewSheet({
  product,
  shopName,
  subtotal,
  onClose,
}: {
  product: ProductWithCategory | null;
  shopName: string;
  subtotal: number;
  onClose: () => void;
}) {
  const { items, add, setQty } = useCart();
  const { show } = useToast();
  const [justAdded, setJustAdded] = useState(false);

  const cartItem = product
    ? findItem({ v: 1, updatedAt: 0, shopId: null, shopSlug: null, shopName: null, items }, product.id)
    : undefined;
  const progress = getCartProgress(subtotal);

  function handleAdd() {
    if (!product?.price) return;
    const result = add(
      { productId: product.id, sku: product.sku, price: product.price },
      1,
      { id: product.shop_id, slug: product.shop_slug, name: shopName },
    );
    if (result === "pending") return;
    trackEvent("add_to_cart", {
      product_id: product.id,
      name: product.name_en,
      price: product.price,
      quantity: 1,
      source: "quick_view",
    });
    setJustAdded(true);
    show(`Added ${product.name_en} to cart`, { label: "View cart", onClick: () => {} });
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <Sheet open={product !== null} onClose={onClose} ariaLabel={product?.name_en ?? "Product details"} manageHistory={false}>
      {product && (
        <div className="relative p-4 pb-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-quickview-close-bg text-ink shadow-soft"
          >
            <X size={16} aria-hidden />
          </button>

          <div className="relative aspect-[8/5] w-full overflow-hidden rounded-2xl bg-secondary-bg">
            {product.image_url ? (
              <ImageWithSkeleton
                src={product.image_url}
                alt={`${product.name_en} — ${product.category?.name_en ?? ""}`}
                fill
                sizes="(max-width: 768px) 100vw, 448px"
                className="object-contain p-3"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-4xl font-semibold text-maroon-ink">
                {product.name_en.trim().charAt(0).toUpperCase() || "?"}
              </div>
            )}
            {product.mrp != null && product.price != null && product.mrp > product.price && (
              <span className="absolute left-3 top-3 rounded-lg bg-price-tag-bg px-2 py-1 text-[11px] font-bold text-price-tag-fg">
                {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
              </span>
            )}
          </div>

          <div className="mt-4">
            <h2 className="font-display text-lg font-bold text-ink">{product.name_en}</h2>
            {product.name_ta && (
              <p lang="ta" className="mt-0.5 text-sm text-ink-soft">
                {product.name_ta}
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              {product.pack ?? formatUnit(product.unit)} · {product.category?.name_en}
            </p>
          </div>

          {(product.noise_type || product.kids_safe) && (
            <div className="mt-2.5 flex gap-2">
              {product.noise_type && (
                <span className="rounded-full bg-secondary-bg px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
                  {product.noise_type === "no_sound" ? "🔇 No Sound" : "🔊 Sound"}
                </span>
              )}
              {product.kids_safe && (
                <span className="rounded-full bg-teal-tint px-2.5 py-1 text-[11px] font-semibold text-teal-ink">
                  🧸 Kids Safe
                </span>
              )}
            </div>
          )}

          {product.price != null && (
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-extrabold text-ink">{formatRupees(product.price)}</span>
              {product.mrp != null && product.mrp > product.price && (
                <>
                  <span className="text-sm text-muted line-through">{formatRupees(product.mrp)}</span>
                  <span className="text-xs font-semibold text-maroon-ink">
                    You save {formatRupees(product.mrp - product.price)}
                  </span>
                </>
              )}
            </div>
          )}

          {product.description && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{product.description}</p>}

          {!progress.done && (
            <div className="mt-4 rounded-xl bg-teal-tint px-3 py-2.5">
              <p className="text-xs font-semibold text-teal-ink">🎉 {progress.message}</p>
              <div className="mt-1.5 h-[5px] w-full overflow-hidden rounded-full bg-white/60">
                <div className="h-full rounded-full bg-teal transition-[width] duration-300" style={{ width: `${progress.progressPercent}%` }} />
              </div>
            </div>
          )}

          {product.price != null && product.status !== "unavailable" && (
            <div className="mt-5 flex items-center gap-3">
              {cartItem ? (
                <Stepper
                  value={cartItem.qty}
                  onIncrement={() => setQty(product.id, cartItem.qty + 1)}
                  onDecrement={() => setQty(product.id, cartItem.qty - 1)}
                  label={product.name_en}
                  className="rounded-xl border border-border px-2 py-1"
                />
              ) : (
                <Button size="full" variant="primary" onClick={handleAdd} className="h-12 flex-1 text-sm font-semibold">
                  {justAdded ? "Added ✓" : `Add to Cart · ${formatRupees(product.price)}`}
                </Button>
              )}
            </div>
          )}

          <Link
            href={`/s/${product.shop_slug}/p/${product.slug}`}
            className="mt-3 block text-center text-xs font-semibold text-maroon-ink"
          >
            View full product details →
          </Link>
        </div>
      )}
    </Sheet>
  );
}
