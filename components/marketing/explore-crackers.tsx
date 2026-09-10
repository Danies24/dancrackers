"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import type { CategoryRow, ProductWithCategory } from "@/lib/data";

const PREVIEW_COUNT = 8;

/** Homepage "Explore Our Crackers Range" — pill-filtered preview grid. */
export function ExploreCrackers({
  products,
  categories,
}: {
  products: ProductWithCategory[];
  categories: CategoryRow[];
}) {
  const [active, setActive] = useState<string | null>(null);

  const shown = useMemo(() => {
    const base = active ? products.filter((p) => p.category?.slug === active) : products;
    return base.slice(0, PREVIEW_COUNT);
  }, [products, active]);

  return (
    <div>
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        <Pill label="All" active={active === null} onClick={() => setActive(null)} />
        {categories.slice(0, 8).map((c) => (
          <Pill key={c.id} label={c.name_en} active={active === c.slug} onClick={() => setActive(c.slug)} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {shown.map((p, i) => (
          <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
            <ProductCard product={p} />
          </div>
        ))}
        {shown.length === 0 && <p className="col-span-full text-sm text-ink-soft">No products in this category yet.</p>}
      </div>

      <div className="mt-6 text-center">
        <Link href={active ? `/products/${active}` : "/products"} className="text-sm font-semibold text-maroon-ink">
          View All Products →
        </Link>
      </div>
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors ${
        active ? "border-transparent bg-gradient-primary text-on-fill" : "border-border bg-surface text-ink-soft hover:border-maroon-ink"
      }`}
    >
      {label}
    </button>
  );
}
