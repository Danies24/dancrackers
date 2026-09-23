import type { Metadata } from "next";
import { Suspense } from "react";
import { CrossShopCatalogueClient, CrossShopCatalogueLoadingSkeleton } from "@/components/product/cross-shop-catalogue-client";
import { SkyShotIcon } from "@/components/marketing/sky-shot-icon";
import { getBrowsableShops, getCrossShopProducts } from "@/lib/cross-shop";

import { getCanonicalUrl } from "@/config/brandConfig";

export const metadata: Metadata = {
  title: "Sivakasi Crackers Price List 2026",
  description:
    "Browse the complete Sivakasi crackers price list for 2026 across every Kolagalam shop, with photos and Tamil names. Build your Diwali enquiry list.",
  alternates: {
    canonical: getCanonicalUrl("/products"),
  },
  openGraph: {
    title: "Sivakasi Crackers Price List 2026",
    description:
      "Browse the complete Sivakasi crackers price list for 2026 across every Kolagalam shop, with photos and Tamil names. Build your Diwali enquiry list.",
    url: getCanonicalUrl("/products"),
  },
};

export const revalidate = 120;

export default async function ProductsPage() {
  const [shops, products] = await Promise.all([getBrowsableShops(), getCrossShopProducts({})]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-ink">
        All Products
        <SkyShotIcon size={22} />
      </h1>
      <Suspense fallback={<CrossShopCatalogueLoadingSkeleton />}>
        <CrossShopCatalogueClient products={products} shops={shops} />
      </Suspense>
    </div>
  );
}
