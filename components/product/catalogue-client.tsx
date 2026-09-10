"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { searchProducts, sortProducts, type SortOption } from "@/lib/catalogue-search";
import { trackEvent } from "@/lib/analytics";
import type { CategoryRow, ProductWithCategory } from "@/lib/data";

const PAGE_SIZE = 40;

interface CatalogueClientProps {
  products: ProductWithCategory[];
  categories: CategoryRow[];
  /** Pre-selected category (category page); locked, no "All" chip shown as active elsewhere. */
  lockedCategory?: string;
}

export function CatalogueClient({ products, categories, lockedCategory }: CatalogueClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(lockedCategory ?? searchParams.get("category") ?? "");
  const [sort, setSort] = useState<SortOption>((searchParams.get("sort") as SortOption) ?? "recommended");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Debounce search input 250ms (§13.4) before it affects results/URL.
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // URL is the source of truth (§13.5) — keep it in sync without a page reload.
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (!lockedCategory && category) params.set("category", category);
    if (sort !== "recommended") params.set("sort", sort);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
    setVisibleCount(PAGE_SIZE);
  }, [debouncedQuery, category, sort, router, lockedCategory]);

  const filtered = useMemo(() => {
    let result = products;
    if (category) result = result.filter((p) => p.category?.slug === category);
    result = searchProducts(result, debouncedQuery);
    result = sortProducts(result, sort);
    return result;
  }, [products, category, debouncedQuery, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    if (debouncedQuery) trackEvent("search_performed", { search_term: debouncedQuery, results_count: filtered.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  useEffect(() => {
    if (category) trackEvent("filter_applied", { filter_type: "category", filter_value: category });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    if (sort !== "recommended") trackEvent("sort_applied", { value: sort });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setCategory(lockedCategory ?? "");
    setSort("recommended");
  }, [lockedCategory]);

  return (
    <div>
      {!lockedCategory && (
        <div className="sticky top-14 z-20 -mx-4 border-b border-border bg-cream/95 px-4 py-3 backdrop-blur">
          <div className="relative mb-3">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search crackers, e.g. flower pot, சக்கரம்..."
              aria-label="Search products"
              className="h-11 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-[16px]"
            />
          </div>
          <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
            <CategoryChip label="All" active={category === ""} onClick={() => setCategory("")} />
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                label={c.name_en}
                active={category === c.slug}
                onClick={() => setCategory(c.slug)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
          {debouncedQuery && ` for "${debouncedQuery}"`}
        </p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          aria-label="Sort products"
          className="h-9 rounded-md border border-border bg-surface px-2 text-sm"
        >
          <option value="recommended">Recommended</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyResults query={debouncedQuery} onClear={clearFilters} />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
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

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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

function EmptyResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-ink-soft">
        {query ? `No products match "${query}". Try a shorter word, or browse by category.` : "No products found."}
      </p>
      <button type="button" onClick={onClear} className="flex items-center gap-1 text-sm font-semibold text-maroon-ink">
        <X size={16} aria-hidden /> Clear filters
      </button>
    </div>
  );
}

export function CatalogueLoadingSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
