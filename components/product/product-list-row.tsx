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

function PlaceholderImage({ name }: { name: string }) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex h-full w-full items-center justify-center bg-maroon-tint text-xl font-display font-semibold text-maroon-ink">
      {letter}
    </div>
  );
}

export function ProductListRow({
  product,
  shopName,
  showShopChip = false,
}: {
  product: ProductWithCategory;
  shopName: string;
  showShopChip?: boolean;
}) {
  const { items, add, setQty } = useCart();
  const { show } = useToast();
  const [justAdded, setJustAdded] = useState(false);
  const cartItem = findItem({ v: 1, updatedAt: 0, shopId: null, shopSlug: null, shopName: null, items }, product.id);
  const isUnavailable = product.status === "unavailable";
  const href = `/s/${product.shop_slug}/p/${product.slug}`;

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
      source: "list",
    });
    setJustAdded(true);
    show(`Added ${product.name_en} to cart`, { label: "View cart", onClick: () => {} });
    setTimeout(() => setJustAdded(false), 1200);
  }

  const inCart = !!cartItem;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 overflow-hidden rounded-xl border p-2 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:glow-orange mb-2",
        inCart
          ? "border-teal bg-teal-tint shadow-sm"
          : "border-border bg-surface shadow-sm hover:border-maroon-ink/50",
      )}
    >
      <Link href={href} className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
        {product.image_url ? (
          <ImageWithSkeleton
            src={product.image_url}
            alt={`${product.name_en} — ${product.category?.name_en ?? ""}`}
            fill
            sizes="48px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <PlaceholderImage name={product.name_en} />
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-center min-w-0 py-0.5">
        {showShopChip && <ProductShopChip shopSlug={product.shop_slug} shopName={shopName} />}
        <Link href={href} className="block w-full mb-1">
          <div className="flex items-start gap-1.5">
            <h3 className="text-sm font-semibold text-ink hover:text-maroon-ink transition-colors leading-tight">
              {product.name_en}
            </h3>
            {inCart && (
              <span className="shrink-0 flex items-center gap-0.5 rounded-full bg-teal px-1.5 py-0.5 text-[9px] font-semibold text-on-fill mt-0.5">
                <Check size={9} aria-hidden strokeWidth={3} />
              </span>
            )}
          </div>
          {product.name_ta && (
            <p lang="ta" className="text-xs text-muted mt-0.5 leading-tight">
              {product.name_ta}
            </p>
          )}
        </Link>

        {product.price == null ? (
          <p className="text-xs text-muted">Ask for price</p>
        ) : (
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="tabular-nums text-[14px] font-bold text-ink">
              {formatRupees(product.price)}
            </span>
            {product.mrp != null && product.mrp > product.price && (
              <span className="text-[10px] text-muted line-through tabular-nums">
                {formatRupees(product.mrp)}
              </span>
            )}
            <span className="text-[9px] font-normal text-muted ml-0.5">
              per {formatUnit(product.unit)}
            </span>
          </div>
        )}
      </div>

      <div className="shrink-0 w-[72px]">
        {product.price && !isUnavailable && (
          cartItem ? (
            <Stepper
              value={cartItem.qty}
              size="xs"
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
              size="sm"
              variant="primary"
              onClick={handleAdd}
              aria-label={`Add ${product.name_en} to cart`}
              className="h-7 w-full text-[10px] font-semibold px-0"
            >
              {justAdded ? "✓" : "Add"}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
