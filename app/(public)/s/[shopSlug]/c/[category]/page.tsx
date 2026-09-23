import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogueClient, CatalogueLoadingSkeleton } from "@/components/product/catalogue-client";
import { getShopForCurrentRequest, getShopActiveCategories, getShopCatalogue, getShopCategoryBySlug } from "@/lib/shops";
import { getCanonicalUrl } from "@/config/brandConfig";
import { JsonLd, buildBreadcrumbJsonLd, buildItemListJsonLd } from "@/lib/seo/jsonld";

type RouteParams = { params: Promise<{ shopSlug: string; category: string }> };

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { shopSlug, category: categorySlug } = await params;
  const result = await getShopForCurrentRequest(shopSlug);
  if (!result) return {};
  const category = await getShopCategoryBySlug(result.shop.id, categorySlug);
  if (!category) return {};

  let rawTitle = `${category.name_en} — ${result.shop.name_en} Price List 2026`;
  if (rawTitle.length > 60) rawTitle = `${category.name_en} — ${result.shop.name_en}`;

  return {
    title: rawTitle,
    alternates: { canonical: getCanonicalUrl(`/s/${result.shop.slug}/c/${category.slug}`) },
    robots: result.isPreview ? { index: false, follow: false } : undefined,
  };
}

export default async function ShopCategoryPage({ params }: RouteParams) {
  const { shopSlug, category: categorySlug } = await params;
  const result = await getShopForCurrentRequest(shopSlug);
  if (!result) notFound();
  const { shop } = result;

  const [category, categories, products] = await Promise.all([
    getShopCategoryBySlug(shop.id, categorySlug),
    getShopActiveCategories(shop.id),
    getShopCatalogue(shop.id),
  ]);
  if (!category) notFound();

  const categoryProducts = products.filter((p) => p.category_id === category.id);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: getCanonicalUrl("/") },
    { name: shop.name_en, url: getCanonicalUrl(`/s/${shop.slug}`) },
    { name: category.name_en, url: getCanonicalUrl(`/s/${shop.slug}/c/${category.slug}`) },
  ]);
  const itemListJsonLd = buildItemListJsonLd(
    category.name_en,
    categoryProducts.map((p) => ({
      name: p.name_en,
      url: getCanonicalUrl(`/s/${shop.slug}/p/${p.slug}`),
      image: p.image_url ?? undefined,
    })),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />
      <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/s/${shop.slug}`} className="hover:underline">
              {shop.name_en}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-ink">
            {category.name_en}
          </li>
        </ol>
      </nav>
      <h1 className="font-display text-2xl font-semibold text-ink">{category.name_en}</h1>
      {category.name_ta && (
        <p lang="ta" className="mt-0.5 text-sm text-muted">
          {category.name_ta}
        </p>
      )}
      {category.description && <p className="mt-2 text-sm text-ink-soft">{category.description}</p>}

      <Suspense fallback={<CatalogueLoadingSkeleton />}>
        <CatalogueClient products={products} categories={categories} lockedCategory={category.slug} shopName={shop.name_en} />
      </Suspense>
    </div>
  );
}
