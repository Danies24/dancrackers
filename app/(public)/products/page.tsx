import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogueClient, CatalogueLoadingSkeleton } from "@/components/product/catalogue-client";
import { getActiveCategories, getCatalogue } from "@/lib/data";

export const metadata: Metadata = {
  title: "All Crackers — Full Price List 2026",
  description: "188 crackers with photos, prices and Tamil names. Search, filter, and build your Deepavali order.",
};

export const revalidate = 300;

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getCatalogue(), getActiveCategories()]);

  return (
    <div className="zone-light mx-auto max-w-6xl px-4 py-6">
      <h1 className="font-display text-2xl font-semibold text-ink">All Products</h1>
      <Suspense fallback={<CatalogueLoadingSkeleton />}>
        <CatalogueClient products={products} categories={categories} />
      </Suspense>
    </div>
  );
}
