"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ProductQuickViewSheet } from "@/components/product/product-quick-view-sheet";
import { CartProgressBar } from "@/components/cart/cart-progress-bar";
import { useValidatedCart } from "@/components/cart/use-validated-cart";
import { trackEvent } from "@/lib/analytics";
import { buildCategoryPageGroups, type CategoryPageGroup, type CategoryPageShopMeta, type CategorySortOption } from "@/lib/category-page-sections";
import type { ProductWithShop } from "@/lib/cross-shop";
import type { CategoryGroupRow } from "@/lib/category-groups";

type CategoryTab = "crackers" | "shops";
type CategoryChip = "all" | "under-199" | "kids-safe" | "bestseller" | "min-70-off";

const CHIPS: Array<{ id: CategoryChip; label: string }> = [
  { id: "all", label: "All" },
  { id: "under-199", label: "₹199 Store" },
  { id: "kids-safe", label: "🧸 Kids-safe" },
  { id: "bestseller", label: "★ Bestseller" },
  { id: "min-70-off", label: "Min 70% off" },
];

const CAROUSEL_LIMIT = 10;

function matchesChip(p: ProductWithShop, chip: CategoryChip): boolean {
  switch (chip) {
    case "under-199":
      return p.price !== null && p.price < 199;
    case "kids-safe":
      return !!p.kids_safe;
    case "bestseller":
      return p.is_bestseller;
    case "min-70-off":
      return (p.discount_percent ?? 0) >= 70;
    case "all":
    default:
      return true;
  }
}

export function CategoryPageClient({
  group,
  otherGroups,
  products,
  shopMeta,
}: {
  group: CategoryGroupRow;
  otherGroups: CategoryGroupRow[];
  products: ProductWithShop[];
  shopMeta: CategoryPageShopMeta[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<CategoryTab>((searchParams.get("tab") as CategoryTab) ?? "crackers");
  const [noSound, setNoSound] = useState(searchParams.get("nosound") === "1");
  const [chip, setChip] = useState<CategoryChip>((searchParams.get("chip") as CategoryChip) ?? "all");
  const [sort, setSort] = useState<CategorySortOption>((searchParams.get("sort") as CategorySortOption) ?? "recommended");
  const { totals } = useValidatedCart();

  const shopMetaById = useMemo(() => new Map(shopMeta.map((m) => [m.id, m])), [shopMeta]);

  function syncUrl(next: { tab?: CategoryTab; noSound?: boolean; chip?: CategoryChip; sort?: CategorySortOption }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("item");
    const nextTab = next.tab ?? tab;
    const nextNoSound = next.noSound ?? noSound;
    const nextChip = next.chip ?? chip;
    const nextSort = next.sort ?? sort;
    if (nextTab !== "crackers") params.set("tab", nextTab);
    else params.delete("tab");
    if (nextNoSound) params.set("nosound", "1");
    else params.delete("nosound");
    if (nextChip !== "all") params.set("chip", nextChip);
    else params.delete("chip");
    if (nextSort !== "recommended") params.set("sort", nextSort);
    else params.delete("sort");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const filteredProducts = useMemo(
    () => products.filter((p) => matchesChip(p, chip) && (!noSound || p.noise_type === "no_sound")),
    [products, chip, noSound],
  );

  const groups = useMemo(
    () => buildCategoryPageGroups(filteredProducts, shopMetaById, sort),
    [filteredProducts, shopMetaById, sort],
  );

  const productsBySlug = useMemo(() => {
    const map = new Map<string, ProductWithShop>();
    for (const p of products) map.set(p.slug, p);
    return map;
  }, [products]);

  const quickViewSlug = searchParams.get("item");
  const quickViewProduct = quickViewSlug ? (productsBySlug.get(quickViewSlug) ?? null) : null;

  function openQuickView(product: ProductWithShop) {
    trackEvent("quickview_open", { product_id: product.id, source: "category_page" });
    router.push(`${pathname}?${searchParams.toString() ? `${searchParams.toString()}&` : ""}item=${product.slug}`, { scroll: false });
  }
  function closeQuickView() {
    router.back();
  }

  const featuredGroups = groups.filter((g) => g.shop.isFeatured);
  const otherShopGroups = groups.filter((g) => !g.shop.isFeatured);

  return (
    <div className="pb-24">
      <div className="border-b border-border bg-surface px-4 py-3.5">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Link href="/" aria-label="Back to home" className="text-lg text-ink-soft">
            ←
          </Link>
          <div>
            <h1 className="font-display text-base font-bold text-ink">{group.name_en}</h1>
            {group.name_ta && (
              <p lang="ta" className="text-xs text-muted">
                {group.name_ta}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="sticky top-16 z-20 border-b border-border bg-cream/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex gap-2">
            <div className="flex-1 rounded-full bg-secondary-bg px-3 py-2 text-sm text-ink-soft">🔍 {group.name_en}</div>
            <button
              type="button"
              onClick={() => {
                setNoSound((v) => !v);
                syncUrl({ noSound: !noSound });
                trackEvent("category_filter", { chip: "nosound", value: !noSound });
              }}
              aria-pressed={noSound}
              className={`shrink-0 rounded-xl border px-3 py-1.5 text-[11px] font-bold ${
                noSound ? "border-teal bg-teal-tint text-teal-ink" : "border-border text-ink-soft"
              }`}
            >
              🔇 NO SOUND
            </button>
          </div>

          <div className="mt-3 flex gap-5 border-b border-border">
            <TabButton active={tab === "crackers"} onClick={() => { setTab("crackers"); syncUrl({ tab: "crackers" }); trackEvent("category_tab", { tab: "crackers" }); }}>
              Crackers
            </TabButton>
            <TabButton active={tab === "shops"} onClick={() => { setTab("shops"); syncUrl({ tab: "shops" }); trackEvent("category_tab", { tab: "shops" }); }}>
              Shops
            </TabButton>
          </div>

          {otherGroups.length > 1 && (
            <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto">
              {otherGroups.map((g) => (
                <Link
                  key={g.id}
                  href={`/category/${g.slug}`}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                    g.slug === group.slug ? "bg-maroon text-on-fill" : "bg-secondary-bg text-ink-soft"
                  }`}
                >
                  {g.name_en}
                </Link>
              ))}
            </div>
          )}

          {tab === "crackers" && (
            <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto">
              <div className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink">
                <select
                  value={sort}
                  onChange={(e) => {
                    const next = e.target.value as CategorySortOption;
                    setSort(next);
                    syncUrl({ sort: next });
                    trackEvent("category_filter", { chip: "sort", value: next });
                  }}
                  className="bg-transparent"
                  aria-label="Sort"
                >
                  <option value="recommended">Sort by: Recommended</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
              {CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    const next = chip === c.id ? "all" : c.id;
                    setChip(next);
                    syncUrl({ chip: next });
                    trackEvent("category_filter", { chip: c.id, value: next === c.id });
                  }}
                  aria-pressed={chip === c.id}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                    chip === c.id ? "bg-maroon text-on-fill" : "bg-secondary-bg text-ink-soft"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {tab === "crackers" ? (
          groups.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-ink-soft">No {group.name_en.toLowerCase()} match these filters.</p>
              <button
                type="button"
                onClick={() => {
                  setChip("all");
                  setNoSound(false);
                  syncUrl({ chip: "all", noSound: false });
                }}
                className="text-sm font-semibold text-maroon-ink"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6 pt-4">
              {featuredGroups.length > 0 && <SectionLabel>FEATURED SHOPS</SectionLabel>}
              {featuredGroups.map((g) => (
                <CategoryShopGroup key={g.shop.id} group={g} categorySlug={group.slug} onQuickView={openQuickView} />
              ))}
              {otherShopGroups.length > 0 && <SectionLabel>{featuredGroups.length > 0 ? "ALL SHOPS" : undefined}</SectionLabel>}
              {otherShopGroups.map((g) => (
                <CategoryShopGroup key={g.shop.id} group={g} categorySlug={group.slug} onQuickView={openQuickView} />
              ))}

              {!totals.grandTotal || totals.subtotal < 3999 ? (
                <div className="rounded-xl bg-teal-tint px-4 py-3 text-center">
                  <CartProgressBar subtotal={totals.subtotal} />
                </div>
              ) : null}
            </div>
          )
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-ink-soft">No shops match these filters.</p>
            <button
              type="button"
              onClick={() => {
                setChip("all");
                setNoSound(false);
                syncUrl({ chip: "all", noSound: false });
              }}
              className="text-sm font-semibold text-maroon-ink"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-4">
            {groups.map((g) => (
              <Link
                key={g.shop.id}
                href={g.shop.ownCategorySlug ? `/s/${g.shop.slug}#cat-${g.shop.ownCategorySlug}` : `/s/${g.shop.slug}`}
                onClick={() => trackEvent("category_shop_arrow", { shop: g.shop.slug, category: group.slug })}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3.5"
              >
                <div>
                  <div className="font-display text-sm font-bold text-ink">{g.shop.nameEn}</div>
                  <div className="mt-0.5 text-xs text-ink-soft">
                    {g.itemCount} {group.name_en.toLowerCase()}
                    {g.shop.locationLabel ? ` · ${g.shop.locationLabel}` : ""}
                  </div>
                  {g.shop.bestOfferLabel && <div className="mt-1 text-xs font-semibold text-maroon-ink">{g.shop.bestOfferLabel}</div>}
                </div>
                <span className="text-ink-soft">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ProductQuickViewSheet
        product={quickViewProduct}
        shopName={quickViewProduct?.shop.name_en ?? ""}
        subtotal={totals.subtotal}
        onClose={closeQuickView}
      />
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 pb-2 text-sm font-bold ${active ? "border-maroon text-ink" : "border-transparent text-muted"}`}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] font-extrabold tracking-[0.18em] text-muted">{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function CategoryShopGroup({
  group,
  categorySlug,
  onQuickView,
}: {
  group: CategoryPageGroup;
  categorySlug: string;
  onQuickView: (product: ProductWithShop) => void;
}) {
  const visible = group.products.slice(0, CAROUSEL_LIMIT);
  const hasMore = group.itemCount > CAROUSEL_LIMIT;
  const shopHref = group.shop.ownCategorySlug ? `/s/${group.shop.slug}#cat-${group.shop.ownCategorySlug}` : `/s/${group.shop.slug}`;

  return (
    <div className="cv-auto rounded-[28px] bg-surface py-5 pl-5">
      <div className="flex items-start justify-between pr-5">
        <div>
          <div className="font-display text-lg font-bold text-ink">{group.shop.nameEn}</div>
          <div className="mt-0.5 text-xs text-ink-soft">
            {group.itemCount} items{group.shop.locationLabel ? ` · ${group.shop.locationLabel}` : ""}
            {group.shop.dispatchLabel ? ` · ${group.shop.dispatchLabel}` : ""}
          </div>
          {group.shop.bestOfferLabel && (
            <span className="mt-1.5 inline-block rounded-full border border-gold bg-maroon-tint px-2 py-0.5 text-[11px] font-bold text-maroon-ink">
              {group.shop.bestOfferLabel}
            </span>
          )}
        </div>
        <Link
          href={shopHref}
          aria-label={`Open ${group.shop.nameEn}`}
          onClick={() => trackEvent("category_shop_arrow", { shop: group.shop.slug, category: categorySlug })}
          className="mt-1 shrink-0 text-ink-soft"
        >
          →
        </Link>
      </div>

      <div
        className="scrollbar-none mt-3.5 flex snap-x snap-mandatory gap-2 overflow-x-auto pr-5"
        onScroll={() => trackEvent("category_group_carousel_swipe", { shop: group.shop.slug, category: categorySlug })}
        style={{ touchAction: "pan-x pan-y", overscrollBehaviorX: "contain" }}
      >
        {visible.map((p) => (
          <div key={p.id} className="w-28 shrink-0 snap-start sm:w-32">
            <ProductCard product={p} shopName={p.shop.name_en} showShopChip={false} onQuickView={() => onQuickView(p)} />
          </div>
        ))}
        {hasMore && (
          <Link
            href={shopHref}
            onClick={() => trackEvent("category_view_all_card", { shop: group.shop.slug, category: categorySlug })}
            className="flex w-28 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-center sm:w-32"
          >
            <span className="text-sm font-bold text-maroon-ink">
              View all
              <br />
              {group.itemCount} →
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
