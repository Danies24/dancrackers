"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { ComboPackCard } from "@/components/product/combo-pack-card";
import { CartProgressBar } from "@/components/cart/cart-progress-bar";
import { useValidatedCart } from "@/components/cart/use-validated-cart";
import { FilterChipRow, type ShopFilterChip } from "@/components/shop/filter-chip-row";
import { ShopCategoryCircles, type CategoryCircleItem } from "@/components/shop/shop-category-circles";
import { CollapsibleSection } from "@/components/shop/collapsible-section";
import { ShopMenuFab, type ShopMenuSection } from "@/components/shop/shop-menu-fab";
import { useActiveSection } from "@/components/shop/use-active-section";
import type { ShopPlpSection } from "@/lib/shop-plp-sections";
import type { ProductWithCategory } from "@/lib/data";

const FLAT_SECTION_LABEL: Record<Exclude<ShopPlpSection["kind"], "category">, string> = {
  "top-picks": "⭐ Top Picks from this shop",
  recommended: "Recommended for you",
  "under-199": "Under ₹199",
  "min-70-off": "Min 70% Off",
  combos: "🎁 Combo Packs",
};

function sectionAnchorId(section: ShopPlpSection): string {
  return section.kind === "category" ? `cat-${section.categorySlug}` : `sec-${section.kind}`;
}

function matchesFilter(product: ProductWithCategory, chip: ShopFilterChip): boolean {
  switch (chip) {
    case "no-sound":
      return product.noise_type === "no_sound";
    case "kids-safe":
      return !!product.kids_safe;
    case "under-199":
      return product.price !== null && product.price < 199;
    case "bestseller":
      return product.is_bestseller;
    case "all":
    default:
      return true;
  }
}

/**
 * The shop PLP's client-side orchestration (Swiggy-redesign plan Phase 2) —
 * one already-fetched `sections` array (lib/shops.ts's getShopPlpSections)
 * drives everything below the dark hero header: filter chips, category
 * circles, curated carousels, and the per-category collapsible grids. The
 * curated flat sections (Top Picks / Recommended / Under-₹199 / Min-70%-off
 * / Combos) always render as fixed merchandising rows, unaffected by the
 * filter chips — only the per-category grids filter, same split Swiggy's
 * own category page uses between its "featured" rail and its browse grid.
 */
export function ShopPlpClient({
  sections,
  shopSlug,
  shopName,
}: {
  sections: ShopPlpSection[];
  shopSlug: string;
  shopName: string;
}) {
  const [filter, setFilter] = useState<ShopFilterChip>("all");
  const { totals } = useValidatedCart();

  const categorySections = sections.filter((s) => s.kind === "category");

  const filteredCategorySections = useMemo(
    () =>
      categorySections
        .map((s) => ({ ...s, products: s.kind === "category" ? s.products.filter((p) => matchesFilter(p, filter)) : [] }))
        .filter((s) => s.products.length > 0),
    [categorySections, filter],
  );

  const allAnchorIds = useMemo(() => sections.map(sectionAnchorId), [sections]);
  const activeAnchorId = useActiveSection(allAnchorIds);

  const circleItems: CategoryCircleItem[] = categorySections
    .filter((s): s is Extract<ShopPlpSection, { kind: "category" }> => s.kind === "category")
    .map((s) => ({
      anchorId: `cat-${s.categorySlug}`,
      nameEn: s.nameEn,
      imageUrl: s.products.find((p) => p.image_url)?.image_url ?? null,
      count: s.products.length,
    }));

  const menuSections: ShopMenuSection[] = sections.map((s) => ({
    anchorId: sectionAnchorId(s),
    label: s.kind === "category" ? s.nameEn : FLAT_SECTION_LABEL[s.kind],
    count: s.kind === "combos" ? s.combos.length : s.kind === "category" ? s.products.length : s.products.length,
  }));

  function scrollToAnchor(anchorId: string) {
    document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="pb-24">
      <div className="mx-4 mt-3 rounded-xl bg-teal-tint px-3.5 py-3">
        <CartProgressBar subtotal={totals.subtotal} />
      </div>

      <div className="sticky top-[calc(4rem+2.5rem)] z-20 mt-3 border-b border-border bg-cream/95 px-4 py-3 backdrop-blur">
        <FilterChipRow active={filter} onChange={setFilter} />
      </div>

      <ShopCategoryCircles categories={circleItems} activeAnchorId={activeAnchorId} onSelect={scrollToAnchor} />

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-2">
        {sections.map((section) => {
          const anchorId = sectionAnchorId(section);

          if (section.kind === "combos") {
            return (
              <section key={anchorId} id={anchorId}>
                <h2 className="mb-3 font-display text-base font-bold text-ink">{FLAT_SECTION_LABEL.combos}</h2>
                <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
                  {section.combos.map((combo) => (
                    <ComboPackCard key={combo.id} combo={combo} />
                  ))}
                </div>
              </section>
            );
          }

          if (section.kind !== "category") {
            if (section.products.length === 0) return null;
            return (
              <section key={anchorId} id={anchorId}>
                <h2 className="mb-3 font-display text-base font-bold text-ink">{FLAT_SECTION_LABEL[section.kind]}</h2>
                <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
                  {section.products.map((p) => (
                    <div key={p.id} className="w-36 shrink-0 snap-start">
                      <ProductCard product={p} shopName={shopName} />
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          return null;
        })}

        {filteredCategorySections.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">
            No products match this filter. <button type="button" onClick={() => setFilter("all")} className="font-semibold text-maroon-ink">Clear filter</button>
          </p>
        ) : (
          filteredCategorySections.map((section) => {
            if (section.kind !== "category") return null;
            const anchorId = `cat-${section.categorySlug}`;
            return (
              <section key={anchorId} id={anchorId}>
                <CollapsibleSection storageKey={`${shopSlug}-${section.categorySlug}`} title={section.nameEn} subtitle={`(${section.products.length})`}>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {section.products.map((p) => (
                      <ProductCard key={p.id} product={p} shopName={shopName} />
                    ))}
                  </div>
                </CollapsibleSection>
              </section>
            );
          })
        )}
      </div>

      <ShopMenuFab sections={menuSections} activeAnchorId={activeAnchorId} onSelect={scrollToAnchor} />
    </div>
  );
}
