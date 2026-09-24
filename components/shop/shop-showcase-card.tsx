"use client";

import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { formatRupees } from "@/lib/format";
import type { ShopShowcaseCard as ShopShowcaseCardData } from "@/lib/shops";

/**
 * Home page "Our Shops" card (Swiggy-redesign follow-up) — the same visual
 * language as the category page's per-shop group (components/category/
 * category-page-client.tsx's CategoryShopGroup): name, meta, a live offer
 * badge, a → arrow, and a horizontal carousel of the shop's own top
 * products, the ones most likely to pull a customer into that shop. The
 * whole card navigates to the shop on tap — a plain div (not an <a>, since
 * the product cards inside are themselves real links/buttons and HTML
 * forbids nested interactive elements), with every inner control stopping
 * propagation so "Add" and a product tap do their own thing instead of also
 * navigating.
 */
export function ShopShowcaseCard({ card }: { card: ShopShowcaseCardData }) {
  const router = useRouter();
  const { shop, productCount, maxDiscountPercent, topProducts } = card;
  const isComingSoon = shop.status === "coming_soon";
  const href = `/s/${shop.slug}`;

  function handleCardClick() {
    if (isComingSoon) return;
    router.push(href);
  }

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`Browse ${shop.name_en}`}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="cursor-pointer rounded-[28px] border border-border bg-surface py-5 pl-5 transition-colors hover:border-maroon-ink/40"
    >
      <div className="flex items-start justify-between pr-5">
        <div className="min-w-0">
          {shop.name_ta && (
            <p lang="ta" className="truncate text-xs text-muted">
              {shop.name_ta}
            </p>
          )}
          <div className="font-display text-lg font-bold text-ink">{shop.name_en}</div>
          {shop.tagline && (
            <span className="mt-1 inline-block rounded-full border border-teal bg-teal-tint px-2.5 py-1 text-xs font-extrabold text-teal-ink">
              {shop.tagline}
            </span>
          )}
          <div className="mt-1.5 text-xs text-ink-soft">
            {isComingSoon ? "Coming soon" : `${productCount} items`}
          </div>
          {maxDiscountPercent > 0 && (
            <span className="mt-1.5 inline-block rounded-full border border-gold bg-maroon-tint px-2 py-0.5 text-[11px] font-bold text-maroon-ink">
              Upto {maxDiscountPercent}% off
            </span>
          )}
        </div>
        <span aria-hidden className="mt-1 shrink-0 text-ink-soft">
          →
        </span>
      </div>

      {topProducts.length > 0 && (
        <div
          className="scrollbar-none mt-3.5 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto pr-5"
          onClick={(e) => e.stopPropagation()}
        >
          {topProducts.map((p) => (
            <div key={p.id} className="w-[38%] shrink-0 snap-start">
              <ProductCard product={p} shopName={shop.name_en} />
            </div>
          ))}
        </div>
      )}

      {shop.min_order_value != null && shop.min_order_value > 0 && (
        <p className="mt-2 text-xs text-ink-soft">Min order {formatRupees(shop.min_order_value)}</p>
      )}
    </div>
  );
}
