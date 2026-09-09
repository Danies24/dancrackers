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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};
  return {
    title: `${category.name_en} — Price List 2026`,
    description: `Browse ${category.name_en} with rates and photos.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const [category, categories, products] = await Promise.all([
    getCategory(slug),
    getActiveCategories(),
    getCatalogue(),
  ]);

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-2 text-xs text-muted">
        <Link href="/">Home</Link> / <Link href="/products">Products</Link> / {category.name_en}
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
