import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { CatalogueClient, CatalogueLoadingSkeleton } from "@/components/product/catalogue-client";
import { ComboPackCard } from "@/components/product/combo-pack-card";
import { getShopForCurrentRequest, getShopCategoryWithCounts, getShopCatalogue } from "@/lib/shops";
import { getActiveComboPacks } from "@/lib/combo-packs";
import { getCanonicalUrl } from "@/config/brandConfig";
import { formatRupees } from "@/lib/format";

type RouteParams = { params: Promise<{ shopSlug: string }> };

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { shopSlug } = await params;
  const result = await getShopForCurrentRequest(shopSlug);
  if (!result) return {};
  const { shop, isPreview } = result;
  return {
    title: `${shop.name_en} — Sivakasi Crackers Price List`,
    alternates: { canonical: getCanonicalUrl(`/s/${shop.slug}`) },
    // Preview access to a hidden shop must never end up indexed even though
    // it renders fully (multi-shop spec §5.3).
    robots: isPreview ? { index: false, follow: false } : undefined,
  };
}

export default async function ShopHomePage({ params }: RouteParams) {
  const { shopSlug } = await params;
  const result = await getShopForCurrentRequest(shopSlug);
  if (!result) notFound();
  const { shop } = result;

  const [categories, products, comboPacks] = await Promise.all([
    getShopCategoryWithCounts(shop.id),
    getShopCatalogue(shop.id),
    // Combo packs are Sri Ram-only for now (multi-shop spec §5.6).
    shop.slug === "sri-ram-crackers" ? getActiveComboPacks() : Promise.resolve([]),
  ]);
  const activeCategories = categories.filter((c) => c.productCount > 0);

  return (
    <div>
      <section className="border-b border-border bg-secondary-bg px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {shop.logo_url ? (
            <Image
              src={shop.logo_url}
              alt={shop.name_en}
              width={56}
              height={56}
              className="mb-3 h-14 w-14 rounded-2xl object-cover"
            />
          ) : (
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-lg font-bold text-on-fill">
              {shop.name_en.slice(0, 2).toUpperCase()}
            </div>
          )}
          {shop.name_ta && (
            <p lang="ta" className="text-sm text-muted">
              {shop.name_ta}
            </p>
          )}
          <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">{shop.name_en}</h1>
          {shop.tagline && <p className="mt-1 text-sm text-ink-soft">{shop.tagline}</p>}
          {shop.min_order_value != null && shop.min_order_value > 0 && (
            <p className="mt-2 text-xs font-medium text-maroon-ink">
              குறைந்தபட்ச ஆர்டர் {formatRupees(shop.min_order_value)} / Min order {formatRupees(shop.min_order_value)}
            </p>
          )}
        </div>
      </section>

      {comboPacks.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-4 pt-8">
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">Combo Packs</h2>
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
            {comboPacks.map((combo) => (
              <ComboPackCard key={combo.id} combo={combo} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-8">
        {activeCategories.length === 0 ? (
          <p className="py-16 text-center text-ink-soft">Our catalogue for this shop is being updated.</p>
        ) : (
          <Suspense fallback={<CatalogueLoadingSkeleton />}>
            <CatalogueClient products={products} categories={activeCategories} />
          </Suspense>
        )}
      </section>
    </div>
  );
}
