"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ArrowDownUp } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { searchCrossShopProducts, sortCrossShopProducts, type CrossShopSortOption } from "@/lib/cross-shop-sort";
import { trackEvent } from "@/lib/analytics";
import type { ProductWithShop } from "@/lib/cross-shop";
import type { ShopRow } from "@/lib/shops";

const PAGE_SIZE = 40;

interface CrossShopCatalogueClientProps {
  products: ProductWithShop[];
  shops: ShopRow[];
  /** Shown in the empty state and page context — e.g. a group's name. */
  emptyContextLabel?: string;
}

/**
 * The cross-shop equivalent of CatalogueClient — /products and
 * /products/[groupSlug] (multi-shop spec §5.5). Filters by shop instead of
 * category (there's only one category/group in scope on these pages), and
 * every card carries its shop-name chip since products from more than one
 * shop appear side by side here.
 */
export function CrossShopCatalogueClient({ products, shops, emptyContextLabel }: CrossShopCatalogueClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [shopFilter, setShopFilter] = useState(searchParams.get("shop") ?? "");
  const [sort, setSort] = useState<CrossShopSortOption>((searchParams.get("sort") as CrossShopSortOption) ?? "recommended");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const shopsWithItems = useMemo(() => {
    const idsWithItems = new Set(products.map((p) => p.shop_id));
    return shops.filter((s) => idsWithItems.has(s.id));
  }, [products, shops]);

  const handleShopChange = (slug: string) => {
    setShopFilter(slug);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (shopFilter) params.set("shop", shopFilter);
    if (sort !== "recommended") params.set("sort", sort);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
    setVisibleCount(PAGE_SIZE);
  }, [debouncedQuery, shopFilter, sort, router]);

  const filtered = useMemo(() => {
    let result = products;
    if (shopFilter) result = result.filter((p) => p.shop.slug === shopFilter);
    result = searchCrossShopProducts(result, debouncedQuery);
    result = sortCrossShopProducts(result, sort);
    return result;
  }, [products, shopFilter, debouncedQuery, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    if (debouncedQuery) trackEvent("search_performed", { search_term: debouncedQuery, results_count: filtered.length });
  }, [debouncedQuery]);

  useEffect(() => {
    if (shopFilter) trackEvent("filter_applied", { filter_type: "shop", filter_value: shopFilter });
  }, [shopFilter]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setShopFilter("");
    setSort("recommended");
  }, []);

  const activeShopName = shops.find((s) => s.slug === shopFilter)?.name_en;

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-4 border-b border-border bg-cream/95 px-4 py-3 backdrop-blur">
        <div className="relative mb-3 flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search crackers, e.g. flower pot, சக்கரம்..."
              aria-label="Search products"
              className="h-11 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-[16px]"
            />
          </div>
        </div>
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
          <ShopChip label="எல்லா கடைகளும் / All shops" active={shopFilter === ""} onClick={() => handleShopChange("")} />
          {shopsWithItems.map((s) => (
            <ShopChip key={s.id} label={s.name_en} active={shopFilter === s.slug} onClick={() => handleShopChange(s.slug)} />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
          {debouncedQuery && ` for "${debouncedQuery}"`}
        </p>
        <div
          className={`relative flex items-center rounded-md border border-border transition-colors ${
            sort !== "recommended" ? "bg-maroon-tint text-maroon-ink" : "bg-surface text-muted hover:bg-surface-hover"
          }`}
        >
          <div className="p-1.5 pointer-events-none" aria-hidden>
            <ArrowDownUp size={18} />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as CrossShopSortOption)}
            aria-label="Sort products"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          >
            <option value="recommended">Recommended</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyResults query={debouncedQuery} shopName={activeShopName} contextLabel={emptyContextLabel} onClear={clearFilters} />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} shopName={p.shop.name_en} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-md border-2 border-maroon-ink px-6 py-2.5 text-sm font-semibold text-maroon-ink"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ShopChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap ${
        active ? "border-maroon bg-maroon text-white" : "border-border bg-surface text-ink-soft"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyResults({
  query,
  shopName,
  contextLabel,
  onClear,
}: {
  query: string;
  shopName?: string;
  contextLabel?: string;
  onClear: () => void;
}) {
  const message = query
    ? `No products match "${query}". Try a shorter word, or browse by shop.`
    : shopName && contextLabel
      ? `இந்தக் கடையில் இந்த வகை இல்லை / ${shopName} has no items in ${contextLabel}.`
      : "No products found.";

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-ink-soft">{message}</p>
      <button type="button" onClick={onClear} className="flex items-center gap-1 text-sm font-semibold text-maroon-ink">
        <X size={16} aria-hidden /> Clear filters
      </button>
    </div>
  );
}

export function CrossShopCatalogueLoadingSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
