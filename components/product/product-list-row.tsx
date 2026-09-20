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
import type { ProductWithCategory } from "@/lib/data";

function PlaceholderImage({ name }: { name: string }) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex h-full w-full items-center justify-center bg-maroon-tint text-xl font-display font-semibold text-maroon-ink">
      {letter}
    </div>
  );
}

export function ProductListRow({ product }: { product: ProductWithCategory }) {
  const { items, add, setQty } = useCart();
  const { show } = useToast();
  const [justAdded, setJustAdded] = useState(false);
  const cartItem = findItem({ v: 1, updatedAt: 0, items }, product.id);
  const isUnavailable = product.status === "unavailable";

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!product.price) return;
    add({ productId: product.id, sku: product.sku, price: product.price }, 1);
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
      <Link href={`/product/${product.slug}`} className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
        {product.image_url ? (
          <ImageWithSkeleton
            src={product.image_url}
            alt={`${product.name_en} — ${product.category?.name_en ?? ""}`}
            fill
            sizes="56px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <PlaceholderImage name={product.name_en} />
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-center min-w-0">
        <Link href={`/product/${product.slug}`} className="block w-full">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-ink hover:text-maroon-ink transition-colors">
              {product.name_en}
            </h3>
            {inCart && (
              <span className="shrink-0 flex items-center gap-0.5 rounded-full bg-teal px-1.5 py-0.5 text-[9px] font-semibold text-on-fill">
                <Check size={9} aria-hidden strokeWidth={3} />
              </span>
            )}
          </div>
          {product.name_ta && (
            <p lang="ta" className="truncate text-xs text-muted mt-0.5">
              {product.name_ta}
            </p>
          )}
        </Link>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-center pr-1">
        {product.price == null ? (
          <p className="text-xs text-muted">Ask for price</p>
        ) : (
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5">
              {product.mrp != null && product.mrp > product.price && (
                <span className="text-xs text-muted line-through tabular-nums">
                  {formatRupees(product.mrp)}
                </span>
              )}
              <span className="tabular-nums text-[15px] font-bold text-ink">
                {formatRupees(product.price)}
              </span>
            </div>
            <span className="text-[10px] font-normal text-muted">
              per {formatUnit(product.unit)}
            </span>
          </div>
        )}
      </div>

      <div className="shrink-0 w-[76px]">
        {product.price && !isUnavailable && (
          cartItem ? (
            <Stepper
              value={cartItem.qty}
              size="sm"
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
              className="h-8 w-full text-xs font-semibold px-0"
            >
              {justAdded ? "✓" : "Add"}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
