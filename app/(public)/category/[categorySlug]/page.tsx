import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryPageData } from "@/lib/cross-shop";
import { getAllCategoryGroups } from "@/lib/category-groups";
import { CategoryPageClient } from "@/components/category/category-page-client";
import { getCanonicalUrl } from "@/config/brandConfig";
import { JsonLd, buildBreadcrumbJsonLd, buildItemListJsonLd } from "@/lib/seo/jsonld";

export const revalidate = 300;

type RouteParams = { params: Promise<{ categorySlug: string }> };

export async function generateStaticParams() {
  const groups = await getAllCategoryGroups();
  return groups.map((g) => ({ categorySlug: g.slug }));
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { categorySlug } = await params;
  const data = await getCategoryPageData(categorySlug);
  if (!data) return {};
  const { group } = data;
  let rawTitle = `${group.name_en} Price List 2026`;
  if (rawTitle.length > 45) rawTitle = group.name_en.length > 45 ? `${group.name_en.slice(0, 42)}...` : group.name_en;
  const canonicalUrl = getCanonicalUrl(`/category/${group.slug}`);
  const desc = `Browse ${group.name_en} (${group.name_ta || ""}) across every Kolagalam shop, with 2026 Sivakasi crackers prices and photos.`;

  return {
    title: rawTitle,
    description: desc.replace(/\s+/g, " ").slice(0, 155),
    alternates: { canonical: canonicalUrl },
    openGraph: { title: rawTitle, description: desc, url: canonicalUrl },
  };
}

export default async function CategoryPage({ params }: RouteParams) {
  const { categorySlug } = await params;
  const data = await getCategoryPageData(categorySlug);
  if (!data) notFound();
  const { group, groups, otherGroups } = data;

  const allProducts = groups.flatMap((g) => g.products);
  const shopMeta = groups.map((g) => g.shop);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: getCanonicalUrl("/") },
    { name: group.name_en, url: getCanonicalUrl(`/category/${group.slug}`) },
  ]);
  const itemListJsonLd = buildItemListJsonLd(
    group.name_en,
    allProducts.map((p) => ({ name: p.name_en, url: getCanonicalUrl(`/s/${p.shop_slug}/p/${p.slug}`), image: p.image_url ?? undefined })),
  );

  return (
    <div>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />
      <CategoryPageClient group={group} otherGroups={otherGroups} products={allProducts} shopMeta={shopMeta} />
    </div>
  );
}
