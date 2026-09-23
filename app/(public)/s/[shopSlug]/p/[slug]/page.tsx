import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDetailActions } from "@/components/product/product-detail-actions";
import { ComboVarietySwitcher } from "@/components/product/combo-variety-switcher";
import { ProductCard } from "@/components/product/product-card";
import { ProductViewTracker } from "@/components/product/product-view-tracker";
import { SparklerIcon } from "@/components/marketing/sparkler-icon";
import { Badge } from "@/components/ui/badge";
import { formatRupees, formatUnit } from "@/lib/format";
import { getShopForCurrentRequest, getShopProductBySlug } from "@/lib/shops";
import { getRelatedProducts } from "@/lib/data";
import { getCanonicalUrl, getPhoneDisplay, getPhoneE164 } from "@/config/brandConfig";
import { JsonLd, buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/jsonld";

type RouteParams = { params: Promise<{ shopSlug: string; slug: string }> };

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { shopSlug, slug } = await params;
  const result = await getShopForCurrentRequest(shopSlug);
  if (!result) return {};
  const product = await getShopProductBySlug(result.shop.id, slug);
  if (!product) return {};

  const canonicalUrl = getCanonicalUrl(`/s/${result.shop.slug}/p/${product.slug}`);
  const priceSnippet = product.price ? ` (${formatRupees(product.price)})` : "";
  let rawTitle = `${product.name_en}${priceSnippet}`;
  if (rawTitle.length > 45) {
    rawTitle = product.name_en.length > 45 ? `${product.name_en.slice(0, 42)}...` : product.name_en;
  }
  const desc = product.price
    ? `${product.name_en} (${product.name_ta || ""}) at ${formatRupees(product.price)} per ${formatUnit(product.unit)}, from ${result.shop.name_en}.`
    : `${product.name_en} Sivakasi crackers price list & Diwali enquiry from ${result.shop.name_en}.`;

  return {
    title: rawTitle,
    description: desc.replace(/\s+/g, " ").slice(0, 155),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: rawTitle,
      description: desc,
      url: canonicalUrl,
      images: product.image_url ? [product.image_url] : undefined,
    },
    robots: result.isPreview ? { index: false, follow: false } : undefined,
  };
}

export default async function ShopProductPage({ params }: RouteParams) {
  const { shopSlug, slug } = await params;
  const result = await getShopForCurrentRequest(shopSlug);
  if (!result) notFound();
  const { shop } = result;

  const product = await getShopProductBySlug(shop.id, slug);
  if (!product) notFound();

  const images = product.image_url ? [product.image_url, ...(product.image_urls ?? [])] : [];
  const isUnavailable = product.status === "unavailable";
  const isCallForRate = !product.price;

  const crumbs = [
    { name: "Home", url: getCanonicalUrl("/") },
    { name: shop.name_en, url: getCanonicalUrl(`/s/${shop.slug}`) },
  ];
  if (product.category?.slug) {
    crumbs.push({
      name: product.category.name_en,
      url: getCanonicalUrl(`/s/${shop.slug}/c/${product.category.slug}`),
    });
  }
  crumbs.push({ name: product.name_en, url: getCanonicalUrl(`/s/${shop.slug}/p/${product.slug}`) });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(crumbs);
  const productJsonLd = buildProductJsonLd({
    name: product.name_en,
    description: product.description ?? `${product.name_en} Sivakasi crackers price list, from ${shop.name_en}.`,
    sku: product.sku ?? undefined,
    image: product.image_url ?? undefined,
    url: getCanonicalUrl(`/s/${shop.slug}/p/${product.slug}`),
    category: product.category?.name_en ?? undefined,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={productJsonLd} />
      <ProductViewTracker
        productId={product.id}
        sku={product.sku}
        name={product.name_en}
        category={product.category?.name_en}
        price={product.price}
      />
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/s/${shop.slug}`} className="hover:underline">
          {shop.name_en}
        </Link>
        {product.category?.slug && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/s/${shop.slug}/c/${product.category.slug}`} className="hover:underline">
              {product.category.name_en}
            </Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-medium text-ink">
          {product.name_en}
        </span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <ProductGallery images={images} name={product.name_en} category={product.category?.name_en ?? ""} />
          {product.video_url && <video controls className="mt-4 w-full rounded-lg" src={product.video_url} />}
        </div>

        <div className="pb-24 md:pb-0">
          <div className="mb-1 flex flex-wrap gap-1.5">
            {product.combo && (
              <span className="rounded-full bg-combo-badge-bg px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-combo-badge-text">
                {product.combo.badgeText}
              </span>
            )}
            {product.is_bestseller && <Badge variant="bestseller" />}
            {isUnavailable && <Badge variant="unavailable" />}
          </div>
          {product.combo ? (
            <>
              {product.combo.tagline && <p className="mb-1 text-sm text-ink-soft">{product.combo.tagline}</p>}
              <ComboVarietySwitcher
                packName={product.combo.packName}
                varieties={product.combo.varieties}
                initialVarietyId={product.combo.varietyId}
                unit={product.unit}
              />
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">{product.name_en}</h1>
              {product.name_ta && (
                <p lang="ta" className="mt-1 text-base text-muted">
                  {product.name_ta}
                </p>
              )}
              <p className="mt-2 text-xs text-ink-soft">
                from{" "}
                <Link href={`/s/${shop.slug}`} className="font-medium text-maroon-ink">
                  {shop.name_en}
                </Link>
              </p>
              {product.category?.slug && (
                <Link
                  href={`/s/${shop.slug}/c/${product.category.slug}`}
                  className="mt-2 inline-block text-xs font-medium text-maroon-ink"
                >
                  {product.category.name_en}
                </Link>
              )}

              <div className="mt-4">
                {isCallForRate ? (
                  <p className="text-ink-soft">
                    Ask us for the price on this item —{" "}
                    <a href={`tel:+${getPhoneE164()}`} className="font-semibold text-maroon-ink">
                      {getPhoneDisplay()}
                    </a>
                  </p>
                ) : (
                  <div>
                    {!product.is_discountable && <p className="text-sm text-muted">Special price</p>}
                    <div className="flex flex-wrap items-baseline gap-2 tabular-nums">
                      {product.mrp != null && product.mrp > product.price! && (
                        <span className="text-base text-muted line-through">{formatRupees(product.mrp)}</span>
                      )}
                      <span className="text-3xl font-bold text-ink">{formatRupees(product.price!)}</span>{" "}
                      <span className="text-sm text-muted">
                        per {formatUnit(product.unit)}
                        {product.pack ? ` — ${product.pack}` : ""}
                      </span>
                      <SparklerIcon size={18} />
                    </div>
                  </div>
                )}
              </div>

              {isUnavailable ? (
                <div className="mt-6">
                  <p className="mb-3 text-sm text-ink-soft">This item is currently unavailable.</p>
                  <a
                    href={`https://wa.me/${getPhoneE164()}?text=${encodeURIComponent(
                      `Hi, I'd like to know when ${product.name_en} will be back in stock.`,
                    )}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-block rounded-md bg-whatsapp px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Notify us you want this
                  </a>
                </div>
              ) : (
                !isCallForRate && (
                  <div className="mt-6">
                    <ProductDetailActions productId={product.id} sku={product.sku} price={product.price!} name={product.name_en} />
                  </div>
                )
              )}

              {product.description && <p className="mt-6 text-sm leading-relaxed text-ink-soft">{product.description}</p>}
            </>
          )}

          <p className="mt-6 text-xs text-muted">
            Fireworks are explosives — use only under adult supervision and follow the safety instructions.{" "}
            <Link href="/safety" className="font-medium text-maroon-ink">
              Read safety guidance →
            </Link>
          </p>
        </div>
      </div>

      {!product.combo && product.category_id && (
        <Suspense fallback={null}>
          <RelatedProducts categoryId={product.category_id} excludeProductId={product.id} shopSlug={shop.slug} />
        </Suspense>
      )}
    </div>
  );
}

async function RelatedProducts({
  categoryId,
  excludeProductId,
}: {
  categoryId: string;
  excludeProductId: string;
  shopSlug: string;
}) {
  // categoryId is a uuid unique across shops (never shared between shops),
  // so this is already shop-scoped without needing an extra filter — see
  // lib/data.ts#getRelatedProducts.
  const related = await getRelatedProducts(categoryId, excludeProductId);
  if (related.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="mb-4 font-display text-xl font-semibold text-ink">You may also like</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
