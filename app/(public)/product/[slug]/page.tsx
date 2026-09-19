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
import { getAllProductSlugs, getProductBySlug, getRelatedProducts } from "@/lib/data";
import { getAllComboVarietySlugs } from "@/lib/combo-packs";
import { brandConfig, getCanonicalUrl, getPhoneDisplay, getPhoneE164 } from "@/config/brandConfig";

const DISPLAY_DISCOUNT_LABEL = `${Math.round(brandConfig.marketingDiscountPercent)}% OFF`;

export const revalidate = 300;
// Every product/combo-variety slug not in the two lists below is dynamic — a
// product added since the last deploy still opens fine, just via an
// on-demand ISR render the first time (same as before this fix).
export const dynamicParams = true;

/**
 * Pre-renders every product/combo-variety page at build/deploy time. Without
 * this, each of the ~200 pages paid a cold on-demand-ISR render (two
 * sequential Supabase round trips, plus a serverless invocation) on its
 * first click after every 300s revalidate window — the actual cause of
 * "clicking a product card takes a long time to open the page". With the
 * catalogue this small, pre-rendering all of them is cheap and eliminates
 * that cold path almost entirely.
 */
export async function generateStaticParams() {
  const [productSlugs, comboSlugs] = await Promise.all([getAllProductSlugs(), getAllComboVarietySlugs()]);
  return [...new Set([...productSlugs, ...comboSlugs])].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const canonicalUrl = getCanonicalUrl(`/product/${product.slug}`);
  const priceSnippet = product.price ? ` (${formatRupees(product.price)})` : "";
  let rawTitle = `${product.name_en}${priceSnippet}`;
  if (rawTitle.length > 45) {
    rawTitle = product.name_en.length > 45 ? `${product.name_en.slice(0, 42)}...` : product.name_en;
  }
  const desc = product.price
    ? `${product.name_en} (${product.name_ta || ""}) at ${formatRupees(product.price)} per ${formatUnit(product.unit)}. Sivakasi crackers enquiry from Kolagalam.`
    : `${product.name_en} Sivakasi crackers price list & Diwali enquiry from Kolagalam.`;
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
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

import { JsonLd, buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/jsonld";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const images = product.image_url ? [product.image_url, ...(product.image_urls ?? [])] : [];
  const isUnavailable = product.status === "unavailable";
  const isCallForRate = !product.price;

  const crumbs = [
    { name: "Home", url: getCanonicalUrl("/") },
    { name: "Products", url: getCanonicalUrl("/products") },
  ];
  if (product.category) {
    crumbs.push({
      name: product.category.name_en,
      url: getCanonicalUrl(`/products/${product.category.slug}`),
    });
  }
  crumbs.push({
    name: product.name_en,
    url: getCanonicalUrl(`/product/${product.slug}`),
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(crumbs);
  const productJsonLd = buildProductJsonLd({
    name: product.name_en,
    description:
      product.description ??
      `${product.name_en} Sivakasi crackers price list & Diwali order enquiry from Kolagalam.`,
    sku: product.sku ?? undefined,
    image: product.image_url ?? undefined,
    url: getCanonicalUrl(`/product/${product.slug}`),
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
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li>
            <Link href="/" className="hover:underline">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/products" className="hover:underline">Products</Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/products/${product.category.slug}`} className="hover:underline">
                  {product.category.name_en}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-ink">
            {product.name_en}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <ProductGallery images={images} name={product.name_en} category={product.category?.name_en ?? ""} />
          {product.video_url && (
            <video controls className="mt-4 w-full rounded-lg" src={product.video_url} />
          )}
        </div>

        <div className="pb-24 md:pb-0">
          <div className="mb-1 flex flex-wrap gap-1.5">
            {product.combo && (
              <span className="rounded-full bg-combo-badge-bg px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-combo-badge-text">
                {product.combo.badgeText}
              </span>
            )}
            {product.is_discountable && product.discount_percent != null && (
              <span className="rounded-full bg-maroon px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-on-fill">
                {DISPLAY_DISCOUNT_LABEL}
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
              {product.category && (
                <Link
                  href={`/products/${product.category.slug}`}
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
                    <p className="flex items-center gap-2 tabular-nums">
                      <span className="text-3xl font-bold text-ink">{formatRupees(product.price!)}</span>{" "}
                      <span className="text-sm text-muted">per {formatUnit(product.unit)}</span>
                      <SparklerIcon size={18} />
                    </p>
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
          <RelatedProducts categoryId={product.category_id} excludeProductId={product.id} />
        </Suspense>
      )}
    </div>
  );
}

/**
 * Streamed in below the fold, after the main content has already painted —
 * "You may also like" is never on the critical path for a page that's
 * pre-rendered for the click-through itself (§ generateStaticParams above).
 */
async function RelatedProducts({ categoryId, excludeProductId }: { categoryId: string; excludeProductId: string }) {
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
