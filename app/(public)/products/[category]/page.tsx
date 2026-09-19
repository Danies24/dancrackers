import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogueClient, CatalogueLoadingSkeleton } from "@/components/product/catalogue-client";
import { getActiveCategories, getCatalogue } from "@/lib/data";

export const revalidate = 300;

async function getCategory(slug: string) {
  const categories = await getActiveCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

import { getCanonicalUrl } from "@/config/brandConfig";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};
  const canonicalUrl = getCanonicalUrl(`/products/${category.slug}`);
  let rawTitle = `${category.name_en} Price List 2026`;
  if (rawTitle.length > 45) {
    rawTitle = category.name_en.length > 45 ? `${category.name_en.slice(0, 42)}...` : category.name_en;
  }
  const desc = category.description
    ? `${category.description.slice(0, 100)} — Kolagalam Sivakasi crackers price list 2026.`
    : `Browse ${category.name_en} (${category.name_ta || ""}) price list 2026 with photos. Sivakasi crackers enquiry from Kolagalam.`;
  const cleanDesc = desc.replace(/\s+/g, " ").slice(0, 155);

  return {
    title: rawTitle,
    description: cleanDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: rawTitle,
      description: cleanDesc,
      url: canonicalUrl,
    },
  };
}

import { JsonLd, buildBreadcrumbJsonLd, buildItemListJsonLd } from "@/lib/seo/jsonld";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const [category, categories, products] = await Promise.all([
    getCategory(slug),
    getActiveCategories(),
    getCatalogue(),
  ]);

  if (!category) notFound();

  const categoryProducts = products.filter((p) => p.category_id === category.id);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: getCanonicalUrl("/") },
    { name: "Products", url: getCanonicalUrl("/products") },
    { name: category.name_en, url: getCanonicalUrl(`/products/${category.slug}`) },
  ]);
  const itemListJsonLd = buildItemListJsonLd(
    category.name_en,
    categoryProducts.map((p) => ({
      name: p.name_en,
      url: getCanonicalUrl(`/product/${p.slug}`),
      image: p.image_url ?? undefined,
    }))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />
      <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:underline">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/products" className="hover:underline">Products</Link>
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
        <CatalogueClient products={products} categories={categories} lockedCategory={category.slug} />
      </Suspense>
    </div>
  );
}
