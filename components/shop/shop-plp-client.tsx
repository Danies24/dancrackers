"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ComboPackCard } from "@/components/product/combo-pack-card";
import { ProductQuickViewSheet } from "@/components/product/product-quick-view-sheet";
import { CartProgressBar } from "@/components/cart/cart-progress-bar";
import { useValidatedCart } from "@/components/cart/use-validated-cart";
import { ShopCategoryCircles, type CategoryCircleItem } from "@/components/shop/shop-category-circles";
import { CollapsibleSection } from "@/components/shop/collapsible-section";
import { ShopMenuFab, type ShopMenuSection } from "@/components/shop/shop-menu-fab";
import { useActiveSection } from "@/components/shop/use-active-section";
import type { ShopPlpSection } from "@/lib/shop-plp-sections";
import type { ProductWithCategory } from "@/lib/data";

const ALL_ANCHOR_ID = "cat-all";

const FLAT_SECTION_LABEL: Record<Exclude<ShopPlpSection["kind"], "category">, string> = {
  "top-picks": "⭐ Top Picks from this shop",
  recommended: "Recommended for you",
  "under-199": "Under ₹199",
  combos: "🎁 Combo Packs",
};

function sectionAnchorId(section: ShopPlpSection): string {
  return section.kind === "category" ? `cat-${section.categorySlug}` : `sec-${section.kind}`;
}

/**
 * The shop PLP's client-side orchestration (Swiggy-redesign plan Phase 2) —
 * one already-fetched `sections` array (lib/shops.ts's getShopPlpSections)
 * drives everything below the dark hero header: category circles, curated
 * carousels, and the per-category collapsible grids (led by a synthetic
 * "All" section — every category's products in one grid — since there's no
 * filter chip row anymore to double as a catalogue-wide view).
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
  const { totals } = useValidatedCart();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Every product across every section, flattened once for the quick-view
  // sheet's "resolve by slug from what's already loaded, never fetch" rule
  // — a product can appear in more than one bucket, so later entries simply
  // overwrite earlier (identical) ones in the map.
  const productsBySlug = useMemo(() => {
    const map = new Map<string, ProductWithCategory>();
    for (const s of sections) {
      if (s.kind === "combos") continue;
      for (const p of s.products) map.set(p.slug, p);
    }
    return map;
  }, [sections]);

  const quickViewSlug = searchParams.get("item");
  const quickViewProduct = quickViewSlug ? (productsBySlug.get(quickViewSlug) ?? null) : null;

  function openQuickView(product: ProductWithCategory) {
    router.push(`${pathname}?item=${product.slug}`, { scroll: false });
  }
  function closeQuickView() {
    router.back();
  }

  const categorySections = sections.filter(
    (s): s is Extract<ShopPlpSection, { kind: "category" }> => s.kind === "category",
  );

  // Every category's products in one grid — replaces the old filter chips'
  // "All" state now that there's no chip row to hold it.
  const allProducts = useMemo(() => categorySections.flatMap((s) => s.products), [categorySections]);

  const allAnchorIds = useMemo(() => [ALL_ANCHOR_ID, ...sections.map(sectionAnchorId)], [sections]);
  const activeAnchorId = useActiveSection(allAnchorIds);

  const circleItems: CategoryCircleItem[] = [
    { anchorId: ALL_ANCHOR_ID, nameEn: "All", imageUrl: null, count: allProducts.length },
    ...categorySections.map((s) => ({
      anchorId: `cat-${s.categorySlug}`,
      nameEn: s.nameEn,
      imageUrl: s.products.find((p) => p.image_url)?.image_url ?? null,
      count: s.products.length,
    })),
  ];

  const menuSections: ShopMenuSection[] = [
    { anchorId: ALL_ANCHOR_ID, label: "All", count: allProducts.length },
    ...sections.map((s) => ({
      anchorId: sectionAnchorId(s),
      label: s.kind === "category" ? s.nameEn : FLAT_SECTION_LABEL[s.kind],
      count: s.kind === "combos" ? s.combos.length : s.products.length,
    })),
  ];

  function scrollToAnchor(anchorId: string) {
    document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="pb-24">
      <div className="mx-4 mt-3 rounded-xl bg-teal-tint px-3.5 py-3">
        <CartProgressBar subtotal={totals.subtotal} />
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
                      <ProductCard product={p} shopName={shopName} onQuickView={openQuickView} />
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          return null;
        })}

        {allProducts.length > 0 && (
          <section id={ALL_ANCHOR_ID}>
            <CollapsibleSection storageKey={`${shopSlug}-all`} title="All" subtitle={`(${allProducts.length})`} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {allProducts.map((p) => (
                  <div key={p.id} className="cv-auto">
                    <ProductCard product={p} shopName={shopName} onQuickView={openQuickView} />
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </section>
        )}

        {categorySections.map((section) => {
          const anchorId = `cat-${section.categorySlug}`;
          return (
            <section key={anchorId} id={anchorId}>
              <CollapsibleSection storageKey={`${shopSlug}-${section.categorySlug}`} title={section.nameEn} subtitle={`(${section.products.length})`}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {section.products.map((p) => (
                    <div key={p.id} className="cv-auto">
                      <ProductCard product={p} shopName={shopName} onQuickView={openQuickView} />
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </section>
          );
        })}
      </div>

      <ShopMenuFab sections={menuSections} activeAnchorId={activeAnchorId} onSelect={scrollToAnchor} />

      <ProductQuickViewSheet
        product={quickViewProduct}
        shopName={shopName}
        subtotal={totals.subtotal}
        onClose={closeQuickView}
      />
    </div>
  );
}
