import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogueClient, CatalogueLoadingSkeleton } from "@/components/product/catalogue-client";
import { SkyShotIcon } from "@/components/marketing/sky-shot-icon";
import { getActiveCategories, getCatalogue } from "@/lib/data";

import { getCanonicalUrl } from "@/config/brandConfig";

export const metadata: Metadata = {
  title: "Sivakasi Crackers Price List 2026",
  description:
    "Browse the complete Sivakasi crackers price list for 2026 with photos and Tamil names. Build your Diwali enquiry list.",
  alternates: {
    canonical: getCanonicalUrl("/products"),
  },
  openGraph: {
    title: "Sivakasi Crackers Price List 2026",
    description:
      "Browse the complete Sivakasi crackers price list for 2026 with photos and Tamil names. Build your Diwali enquiry list.",
    url: getCanonicalUrl("/products"),
  },
};

export const revalidate = 300;

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getCatalogue(), getActiveCategories()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-ink">
        All Products
        <SkyShotIcon size={22} />
      </h1>
      <Suspense fallback={<CatalogueLoadingSkeleton />}>
        <CatalogueClient products={products} categories={categories} />
      </Suspense>
    </div>
  );
}
