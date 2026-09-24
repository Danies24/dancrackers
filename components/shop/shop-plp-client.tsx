"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ProductListRow } from "@/components/product/product-list-row";
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

const VIEW_MODE_STORAGE_KEY = "kg_shop_view_mode";
// Global sticky header (h-16 = 64px) + ShopStickyBar (components/shop/
// shop-sticky-bar.tsx, sticky top-16) — the fixed part of the sticky stack
// that sits ABOVE the category circles row. The circles row's own height is
// measured at runtime (below) since it can wrap differently across widths.
const HEADER_STACK_HEIGHT = 104;

const FLAT_SECTION_LABEL: Record<Exclude<ShopPlpSection["kind"], "category">, string> = {
  "top-picks": "⭐ Top Picks from this shop",
  recommended: "Recommended for you",
  "under-199": "🔥 Under ₹199",
  combos: "🎁 Combo Packs",
};

function sectionAnchorId(section: ShopPlpSection): string {
  return section.kind === "category" ? `cat-${section.categorySlug}` : `sec-${section.kind}`;
}

/**
 * The shop PLP's client-side orchestration (Swiggy-redesign plan Phase 2) —
 * one already-fetched `sections` array (lib/shops.ts's getShopPlpSections)
 * drives everything below the dark hero header: a sticky category-circles
 * row, curated carousels, and the per-category collapsible grids (led by a
 * synthetic "All" section — every category's products in one grid — since
 * there's no filter chip row anymore to double as a catalogue-wide view).
 * Grid/list view (persisted like the old CatalogueClient's toggle) applies
 * to the "All" and per-category sections only — the curated flat carousels
 * always stay horizontal, same as before.
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const stickyRowRef = useRef<HTMLDivElement>(null);
  const [scrollMarginTop, setScrollMarginTop] = useState(HEADER_STACK_HEIGHT + 90);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (saved === "list" || saved === "grid") setViewMode(saved);
    } catch {
      // Per-viewer convenience only.
    }
  }, []);

  function handleViewModeChange(mode: "grid" | "list") {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // Same as above — best effort only.
    }
  }

  // The category circles row is itself sticky, directly below the global
  // header + ShopStickyBar — so a scrollIntoView({block:"start"}) needs
  // every section to reserve that much space via scroll-margin-top, or the
  // sticky stack covers the section's first couple of rows on arrival. The
  // row's own height is measured (not hardcoded) since it can wrap to two
  // lines on a narrow phone.
  useEffect(() => {
    const el = stickyRowRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0;
      setScrollMarginTop(HEADER_STACK_HEIGHT + height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  const allAnchorIds = useMemo(() => sections.map(sectionAnchorId), [sections]);
  const [activeAnchorId, jumpToSection] = useActiveSection(allAnchorIds);

  const circleItems: CategoryCircleItem[] = categorySections.map((s) => ({
    anchorId: `cat-${s.categorySlug}`,
    nameEn: s.nameEn,
    imageUrl: s.products.find((p) => p.image_url)?.image_url ?? null,
    count: s.products.length,
  }));

  const menuSections: ShopMenuSection[] = sections.map((s) => ({
    anchorId: sectionAnchorId(s),
    label: s.kind === "category" ? s.nameEn : FLAT_SECTION_LABEL[s.kind],
    count: s.kind === "combos" ? s.combos.length : s.products.length,
  }));

  function scrollToAnchor(anchorId: string) {
    jumpToSection(anchorId);
    document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderProducts(products: ProductWithCategory[]) {
    if (viewMode === "list") {
      return (
        <div className="flex flex-col">
          {products.map((p) => (
            <ProductListRow key={p.id} product={p} shopName={shopName} />
          ))}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="cv-auto">
            <ProductCard product={p} shopName={shopName} onQuickView={openQuickView} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="mx-4 mt-3 rounded-xl bg-teal-tint px-3.5 py-3">
        <CartProgressBar subtotal={totals.subtotal} />
      </div>

      <div ref={stickyRowRef} className="sticky z-20 border-b border-border bg-cream/95 backdrop-blur" style={{ top: HEADER_STACK_HEIGHT }}>
        <ShopCategoryCircles categories={circleItems} activeAnchorId={activeAnchorId} onSelect={scrollToAnchor} />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-2">
        {sections.map((section) => {
          const anchorId = sectionAnchorId(section);

          if (section.kind === "combos") {
            return (
              <section key={anchorId} id={anchorId} style={{ scrollMarginTop }}>
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
            const isUnder199 = section.kind === "under-199";
            return (
              <section key={anchorId} id={anchorId} style={{ scrollMarginTop }}>
                <h2 className="mb-3 font-display text-base font-bold text-ink">{FLAT_SECTION_LABEL[section.kind]}</h2>
                <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
                  {section.products.map((p) => (
                    <div key={p.id} className={`shrink-0 snap-start ${isUnder199 ? "w-28" : "w-36"}`}>
                      <ProductCard product={p} shopName={shopName} onQuickView={openQuickView} />
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          return null;
        })}

        {categorySections.length > 0 && (
          <div className="flex justify-end">
            <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
          </div>
        )}

        {categorySections.map((section) => {
          const anchorId = `cat-${section.categorySlug}`;
          return (
            <section key={anchorId} id={anchorId} style={{ scrollMarginTop }}>
              <CollapsibleSection storageKey={`${shopSlug}-${section.categorySlug}`} title={section.nameEn} subtitle={`(${section.products.length})`}>
                {renderProducts(section.products)}
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

function ViewModeToggle({ mode, onChange }: { mode: "grid" | "list"; onChange: (mode: "grid" | "list") => void }) {
  return (
    <div className="flex items-center overflow-hidden rounded-md border border-border bg-surface">
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={mode === "grid"}
        className={`p-1.5 transition-colors ${mode === "grid" ? "bg-maroon-tint text-maroon-ink" : "text-muted"}`}
      >
        <LayoutGrid size={16} />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-label="List view"
        aria-pressed={mode === "list"}
        className={`border-l border-border p-1.5 transition-colors ${mode === "list" ? "bg-maroon-tint text-maroon-ink" : "text-muted"}`}
      >
        <ListIcon size={16} />
      </button>
    </div>
  );
}
