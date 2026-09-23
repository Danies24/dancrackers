import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CrossShopCatalogueClient, CrossShopCatalogueLoadingSkeleton } from "@/components/product/cross-shop-catalogue-client";
import { getBrowsableShops, getCategoryGroupBySlug, getCrossShopProducts } from "@/lib/cross-shop";
import { getCanonicalUrl } from "@/config/brandConfig";

export const revalidate = 120;

import { JsonLd, buildBreadcrumbJsonLd, buildItemListJsonLd } from "@/lib/seo/jsonld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupSlug: string }>;
}): Promise<Metadata> {
  const { groupSlug } = await params;
  const group = await getCategoryGroupBySlug(groupSlug);
  if (!group) return {};
  let rawTitle = `${group.name_en} Price List 2026`;
  if (rawTitle.length > 45) {
    rawTitle = group.name_en.length > 45 ? `${group.name_en.slice(0, 42)}...` : group.name_en;
  }
  const canonicalUrl = getCanonicalUrl(`/products/${group.slug}`);
  const desc = `Browse ${group.name_en} (${group.name_ta || ""}) across every Kolagalam shop, with 2026 Sivakasi crackers prices and photos.`;

  return {
    title: rawTitle,
    description: desc.replace(/\s+/g, " ").slice(0, 155),
    alternates: { canonical: canonicalUrl },
    openGraph: { title: rawTitle, description: desc, url: canonicalUrl },
  };
}

export default async function CrossShopGroupPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  const group = await getCategoryGroupBySlug(groupSlug);
  if (!group) notFound();

  const [shops, products] = await Promise.all([
    getBrowsableShops(),
    getCrossShopProducts({ groupId: group.id }),
  ]);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: getCanonicalUrl("/") },
    { name: "Products", url: getCanonicalUrl("/products") },
    { name: group.name_en, url: getCanonicalUrl(`/products/${group.slug}`) },
  ]);
  const itemListJsonLd = buildItemListJsonLd(
    group.name_en,
    products.map((p) => ({
      name: p.name_en,
      url: getCanonicalUrl(`/s/${p.shop_slug}/p/${p.slug}`),
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
            <Link href="/products" className="hover:underline">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-ink">
            {group.name_en}
          </li>
        </ol>
      </nav>
      {group.name_ta && (
        <p lang="ta" className="text-sm text-muted">
          {group.name_ta}
        </p>
      )}
      <h1 className="font-display text-2xl font-semibold text-ink">{group.name_en}</h1>
      <p className="mt-1 text-sm text-ink-soft">{products.length} items across {shops.length} shops</p>

      <Suspense fallback={<CrossShopCatalogueLoadingSkeleton />}>
        <CrossShopCatalogueClient products={products} shops={shops} emptyContextLabel={group.name_en} />
      </Suspense>
    </div>
  );
}
