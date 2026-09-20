"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, LayoutGrid, List as ListIcon } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ProductListRow } from "@/components/product/product-list-row";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { searchProducts, sortProducts, type SortOption } from "@/lib/catalogue-search";
import { trackEvent } from "@/lib/analytics";
import type { CategoryRow, ProductWithCategory } from "@/lib/data";

const PAGE_SIZE = 40;

interface CatalogueClientProps {
  products: ProductWithCategory[];
  categories: CategoryRow[];
  lockedCategory?: string;
}

export function CatalogueClient({ products, categories, lockedCategory }: CatalogueClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(lockedCategory ?? searchParams.get("category") ?? "");
  const [sort, setSort] = useState<SortOption>((searchParams.get("sort") as SortOption) ?? "recommended");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dc_view_mode");
      if (saved === "list" || saved === "grid") setViewMode(saved);
    } catch {}
  }, []);

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("dc_view_mode", mode);
    } catch {}
  };

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

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

  const visible = viewMode === "list" ? filtered : filtered.slice(0, visibleCount);
  const hasMore = viewMode === "grid" && visibleCount < filtered.length;

  useEffect(() => {
    if (debouncedQuery) trackEvent("search_performed", { search_term: debouncedQuery, results_count: filtered.length });
  }, [debouncedQuery]);

  useEffect(() => {
    if (category) trackEvent("filter_applied", { filter_type: "category", filter_value: category });
  }, [category]);

  useEffect(() => {
    if (sort !== "recommended") trackEvent("sort_applied", { value: sort });
  }, [sort]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setCategory(lockedCategory ?? "");
    setSort("recommended");
  }, [lockedCategory]);

  // Group by category for list view
  const groupedProducts = useMemo(() => {
    if (viewMode !== "list") return [];
    
    // Create an ordered list of groups based on categories array
    const groupMap = new Map<string, ProductWithCategory[]>();
    for (const p of visible) {
      const catId = p.category_id || p.category?.id || "other";
      if (!groupMap.has(catId)) groupMap.set(catId, []);
      groupMap.get(catId)!.push(p);
    }
    
    const groups = [];
    for (const cat of categories) {
      if (groupMap.has(cat.id)) {
        groups.push({ category: cat, products: groupMap.get(cat.id)! });
        groupMap.delete(cat.id);
      }
    }
    
    // Add any remaining
    for (const [catId, prods] of groupMap.entries()) {
      const fallbackCat = prods[0].category || { name_en: "Other" };
      groups.push({ category: fallbackCat, products: prods });
    }
    
    return groups;
  }, [visible, categories, viewMode]);

  return (
    <div>
      {!lockedCategory && (
        <div className="sticky top-16 z-20 -mx-4 border-b border-border bg-cream/95 px-4 py-3 backdrop-blur">
          <div className="relative mb-3 flex gap-2">
            <div className="relative flex-1">
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
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border bg-surface overflow-hidden">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-maroon-tint text-maroon-ink" : "text-muted hover:bg-surface-hover"}`}
              aria-label="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => handleViewModeChange("list")}
              className={`p-1.5 border-l border-border transition-colors ${viewMode === "list" ? "bg-maroon-tint text-maroon-ink" : "text-muted hover:bg-surface-hover"}`}
              aria-label="List view"
            >
              <ListIcon size={18} />
            </button>
          </div>
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
      </div>

      {filtered.length === 0 ? (
        <EmptyResults query={debouncedQuery} onClear={clearFilters} />
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col pb-8">
              {category ? (
                // Single category selected, just list them
                visible.map((p) => (
                  <ProductListRow key={p.id} product={p} />
                ))
              ) : (
                // Grouped by category when "All" is selected
                groupedProducts.map((group) => (
                  <div key={group.category.id || group.category.name_en} className="mb-6">
                    <h2 className="sticky top-[124px] z-10 -mx-4 px-4 py-2 bg-cream/95 backdrop-blur font-display text-lg font-semibold text-ink border-y border-border/50 mb-3 shadow-sm">
                      {group.category.name_en} {group.category.name_ta && <span className="text-sm font-normal text-muted ml-1" lang="ta">({group.category.name_ta})</span>}
                    </h2>
                    <div className="flex flex-col">
                      {group.products.map(p => (
                        <ProductListRow key={p.id} product={p} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
