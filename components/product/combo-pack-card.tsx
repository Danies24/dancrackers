"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toast";
import { findItem } from "@/lib/cart";
import { trackEvent } from "@/lib/analytics";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ComboPackSummary } from "@/lib/combo-packs";

/**
 * The storefront's premium-showcase treatment for a combo pack — a
 * distinct, named component (not a themed ProductCard) per the design
 * brief: reads as a special offer the way a marketplace visually separates
 * a sponsored/assured listing from a plain one, while staying restrained
 * ("warm, not loud" — a highlight, not a flashing discount banner).
 *
 * A single-variety pack (collapsed to one tier) behaves exactly like a
 * regular ProductCard: price, a stepper once it's in the cart, an Add
 * button otherwise. A multi-variety pack additionally gets an inline
 * Small/Medium/Large-style picker (first tier selected by default) —
 * switching it swaps the price and which cart line Add/the stepper act on,
 * entirely client-side, no navigation. Only the image and title are links;
 * the price/picker/cart-controls area is a plain div so tapping it never
 * navigates, same split ProductCard uses.
 */
export function ComboPackCard({ combo }: { combo: ComboPackSummary }) {
  const { items, add, setQty } = useCart();
  const { show } = useToast();
  const [justAdded, setJustAdded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const hasMultipleVarieties = combo.varieties.length > 1;
  const selected = combo.varieties[selectedIndex] ?? combo.varieties[0];
  const cartItem = findItem({ v: 1, updatedAt: 0, items }, selected.id);
  const inCart = !!cartItem;

  function handleAdd() {
    const sku = `COMBO-${selected.slug.toUpperCase()}`;
    add({ productId: selected.id, sku, price: selected.sellingPrice }, 1);
    trackEvent("add_to_cart", {
      product_id: selected.id,
      name: `${combo.name} — ${selected.tierLabel}`,
      price: selected.sellingPrice,
      quantity: 1,
      source: "combo_card",
    });
    setJustAdded(true);
    show(`Added ${combo.name} — ${selected.tierLabel} to cart`, { label: "View cart", onClick: () => {} });
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <div
      className="group flex shrink-0 snap-start flex-col overflow-hidden rounded-[22px] p-[2px] transition-transform duration-300 ease-out hover:-translate-y-1"
      style={{ background: "var(--combo-highlight-border)" }}
    >
      <div className="flex w-[250px] flex-1 flex-col overflow-hidden rounded-[20px] bg-combo-highlight-bg sm:w-[280px] md:w-full">
        <Link href={`/product/${selected.slug}`} className="relative block aspect-square overflow-hidden bg-cream">
          {combo.heroImageUrl ? (
            <Image
              src={combo.heroImageUrl}
              alt={combo.name}
              fill
              sizes="(max-width: 640px) 250px, 280px"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-maroon-ink">
              {combo.name.charAt(0)}
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-combo-badge-bg px-2.5 py-1 text-[10px] font-bold tracking-wide text-combo-badge-text">
            {combo.badgeText}
          </span>
          {inCart && (
            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-teal px-2 py-0.5 text-[10px] font-semibold text-on-fill shadow-soft">
              <Check size={11} aria-hidden strokeWidth={3} /> In Cart
            </span>
          )}
        </Link>

        <div className="flex flex-1 flex-col gap-1 p-3">
          <Link href={`/product/${selected.slug}`}>
            <h3 className="line-clamp-1 text-sm font-semibold text-ink">{combo.name}</h3>
            {combo.tagline && <p className="line-clamp-2 text-xs text-ink-soft">{combo.tagline}</p>}
          </Link>

          {/* Always reserved, even for a single-variety pack — a spacer with
              the same height, invisible rather than unmounted, so every
              combo card lands at the same height regardless of tier count
              (a switcher pack would otherwise sit taller than a plain one). */}
          <div
            className={cn("mt-1.5 flex min-h-7 flex-wrap gap-1", !hasMultipleVarieties && "invisible")}
            role={hasMultipleVarieties ? "group" : undefined}
            aria-label={hasMultipleVarieties ? `${combo.name} size` : undefined}
          >
            {(hasMultipleVarieties ? combo.varieties : [combo.varieties[0]]).map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedIndex(i)}
                aria-pressed={i === selectedIndex}
                aria-label={v.tierLabel}
                tabIndex={hasMultipleVarieties ? 0 : -1}
                className={cn(
                  "flex h-7 items-center justify-center rounded-full border px-3 text-xs font-bold transition-colors",
                  i === selectedIndex
                    ? "border-maroon-ink bg-maroon text-on-fill"
                    : "border-border bg-surface text-ink-soft hover:border-maroon-ink/50",
                )}
              >
                {v.tierLabel}
              </button>
            ))}
          </div>

          <div className="mt-auto flex flex-wrap items-baseline gap-1.5 pt-2">
            {hasMultipleVarieties && <span className="text-xs text-ink-soft">From</span>}
            <span className="tabular-nums text-base font-bold text-ink">
              {formatRupees(selected.sellingPrice)}
            </span>
            <span className="text-xs font-normal text-muted">({selected.totalItems} items)</span>
          </div>

          <div className="pt-1">
            {cartItem ? (
              <Stepper
                value={cartItem.qty}
                onIncrement={() => setQty(selected.id, cartItem.qty + 1)}
                onDecrement={() => {
                  setJustAdded(false);
                  setQty(selected.id, cartItem.qty - 1);
                }}
                label={`${combo.name} — ${selected.tierLabel}`}
                className="w-full justify-between"
              />
            ) : (
              <Button
                size="full"
                variant="primary"
                onClick={handleAdd}
                aria-label={`Add ${combo.name} — ${selected.tierLabel} to cart`}
              >
                {justAdded ? "Added ✓" : "Add"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
