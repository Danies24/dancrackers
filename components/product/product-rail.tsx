import { ProductCard } from "@/components/product/product-card";
import type { ProductWithCategory } from "@/lib/data";

/** Horizontal-scroll rail on mobile, becomes a grid on desktop (§12.1, §26.3). */
export function ProductRail({ products }: { products: ProductWithCategory[] }) {
  if (products.length === 0) return null;
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible lg:grid-cols-6">
      {products.map((p) => (
        <div key={p.id} className="w-40 shrink-0 md:w-auto">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
