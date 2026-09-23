"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageWithSkeleton } from "@/components/product/image-with-skeleton";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toast";
import { formatRupees, formatUnit } from "@/lib/format";
import { findItem } from "@/lib/cart";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { ProductShopChip } from "@/components/shop/product-shop-chip";
import type { ProductWithCategory } from "@/lib/data";

/**
 * The one product card component, used on /products, category pages, home
 * rails and related-products (§13.2). Tapping the image/name navigates;
 * tapping the stepper/Add never does. `shopName` is always required (the
 * "start a new cart?" sheet needs a real shop name, not just a slug, no
 * matter where the card is used); `showShopChip` separately controls the
 * always-visible shop-name pill (multi-shop spec §5.4) — true only where
 * products from more than one shop can appear side by side, false on a
 * shop's own page where the shop is already named in the header/sticky bar.
 */
export function ProductCard({
  product,
  rail,
  shopName,
  showShopChip = false,
  onQuickView,
}: {
  product: ProductWithCategory;
  rail?: string;
  shopName: string;
  showShopChip?: boolean;
  /** When provided, tapping the image/name opens the quick-view sheet with this product instead of navigating to its full page (Swiggy-redesign plan) — omit to keep the card's plain navigate-on-tap behavior. */
  onQuickView?: (product: ProductWithCategory) => void;
}) {
  const { items, add, setQty } = useCart();
  const { show } = useToast();
  const [justAdded, setJustAdded] = useState(false);
  const cartItem = findItem({ v: 1, updatedAt: 0, shopId: null, shopSlug: null, shopName: null, items }, product.id);
  const isUnavailable = product.status === "unavailable";
  const href = `/s/${product.shop_slug}/p/${product.slug}`;
  const ariaLabel = showShopChip
    ? `${product.name_en} — ${product.category?.name_en ?? ""} — ${shopName}`
    : undefined;

  function handleTapCard(e: React.MouseEvent) {
    if (!onQuickView) return;
    e.preventDefault();
    onQuickView(product);
  }

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!product.price) return;
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
      source: "grid",
    });
    setJustAdded(true);
    show(`Added ${product.name_en} to cart`, { label: "View cart", onClick: () => {} });
    setTimeout(() => setJustAdded(false), 1200);
  }

  const inCart = !!cartItem;

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[20px] border transition-all duration-300 ease-out hover:-translate-y-1 hover:glow-orange",
        inCart
          ? "border-teal bg-teal-tint shadow-soft"
          : "border-border bg-surface shadow-soft hover:border-maroon-ink/50",
      )}
    >
      {inCart && (
        <span className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-teal px-2 py-0.5 text-[10px] font-semibold text-on-fill shadow-soft">
          <Check size={11} aria-hidden strokeWidth={3} /> In Cart
        </span>
      )}
      <Link href={href} aria-label={ariaLabel} onClick={handleTapCard} className="relative block aspect-square overflow-hidden bg-white">
        {product.image_url ? (
          <ImageWithSkeleton
            src={product.image_url}
            alt={`${product.name_en} — ${product.category?.name_en ?? ""}`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <PlaceholderImage name={product.name_en} />
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.is_bestseller && <Badge variant="bestseller" />}
          {isUnavailable && <Badge variant="unavailable" />}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {showShopChip && <ProductShopChip shopSlug={product.shop_slug} shopName={shopName} />}
        <Link href={href} aria-label={ariaLabel} onClick={handleTapCard} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink hover:text-maroon-ink transition-colors">
            {product.name_en}
          </h3>
          {product.name_ta && (
            <p lang="ta" className="line-clamp-1 text-xs text-muted mt-0.5">
              {product.name_ta}
            </p>
          )}
        </Link>

        <div className="mt-auto flex flex-col gap-2 pt-1">
          {product.price == null ? (
            <p className="text-xs text-muted">Ask for price</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {!product.is_discountable && (
                <span className="text-[11px] font-medium text-muted">Special price</span>
              )}
              <div className="flex flex-wrap items-baseline gap-1.5">
                {product.mrp != null && product.mrp > product.price && (
                  <span className="text-xs text-muted line-through tabular-nums">
                    {formatRupees(product.mrp)}
                  </span>
                )}
                <span className="tabular-nums text-base font-bold text-ink">
                  {formatRupees(product.price)}
                </span>
              </div>
              <span className="text-xs font-normal text-muted">
                per {formatUnit(product.unit)}
              </span>
            </div>
          )}

          {product.price && !isUnavailable && (
            <div className="pt-0.5">
              {cartItem ? (
                <Stepper
                  value={cartItem.qty}
                  onIncrement={() => setQty(product.id, cartItem.qty + 1)}
                  onDecrement={() => {
                    setJustAdded(false);
                    setQty(product.id, cartItem.qty - 1);
                  }}
                  label={product.name_en}
                  className="w-full justify-between"
                />
              ) : (
                <Button
                  size="full"
                  variant="primary"
                  onClick={handleAdd}
                  aria-label={`Add ${product.name_en} to cart`}
                  className="h-10 text-sm font-semibold w-full"
                >
                  {justAdded ? "Added ✓" : "Add"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlaceholderImage({ name }: { name: string }) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex h-full w-full items-center justify-center bg-maroon-tint text-3xl font-display font-semibold text-maroon-ink">
      {letter}
    </div>
  );
}
