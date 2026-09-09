"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toast";
import { formatRupees, formatUnit } from "@/lib/format";
import { findItem } from "@/lib/cart";
import type { ProductWithCategory } from "@/lib/data";

/**
 * The one product card component, used on /products, category pages, home
 * rails and related-products (§13.2). Tapping the image/name navigates;
 * tapping the stepper/Add never does.
 */
export function ProductCard({ product, rail }: { product: ProductWithCategory; rail?: string }) {
  const { items, add, setQty } = useCart();
  const { show } = useToast();
  const [justAdded, setJustAdded] = useState(false);
  const cartItem = findItem({ v: 1, updatedAt: 0, items }, product.id);
  const isUnavailable = product.status === "unavailable";

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!product.price) return;
    add({ productId: product.id, sku: product.sku, price: product.price }, 1);
    setJustAdded(true);
    show(`Added ${product.name_en} to cart`, { label: "View cart", onClick: () => {} });
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-sm">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square bg-cream">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={`${product.name_en} — ${product.category?.name_en ?? ""}`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <PlaceholderImage name={product.name_en} />
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {!product.is_discountable && <Badge variant="net-rate" />}
          {product.is_bestseller && <Badge variant="bestseller" />}
          {isUnavailable && <Badge variant="unavailable" />}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={`/product/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-ink">{product.name_en}</h3>
          {product.name_ta && (
            <p lang="ta" className="line-clamp-1 text-xs text-muted">
              {product.name_ta}
            </p>
          )}
        </Link>

        <div className="mt-auto flex items-end justify-between pt-1">
          {product.price ? (
            <p className="tabular-nums text-base font-bold text-ink">
              {formatRupees(product.price)}{" "}
              <span className="text-xs font-normal text-muted">
                per {formatUnit(product.unit)}
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted">Call for rate</p>
          )}
        </div>

        {product.price && !isUnavailable && (
          <div className="pt-1">
            {cartItem ? (
              <Stepper
                value={cartItem.qty}
                onIncrement={() => setQty(product.id, cartItem.qty + 1)}
                onDecrement={() => setQty(product.id, cartItem.qty - 1)}
                label={product.name_en}
                className="w-full justify-between"
              />
            ) : (
              <Button size="full" variant="primary" onClick={handleAdd} aria-label={`Add ${product.name_en} to cart`}>
                {justAdded ? "Added ✓" : "Add"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceholderImage({ name }: { name: string }) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex h-full w-full items-center justify-center bg-maroon-tint text-3xl font-display font-semibold text-maroon">
      {letter}
    </div>
  );
}
