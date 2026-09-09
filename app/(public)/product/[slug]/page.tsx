import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDetailActions } from "@/components/product/product-detail-actions";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";
import { formatRupees, formatUnit } from "@/lib/format";
import { getProductBySlug, getRelatedProducts } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.price
      ? `${product.name_en}${product.name_ta ? ` (${product.name_ta})` : ""} — ${formatRupees(product.price)} per ${formatUnit(product.unit)}`
      : product.name_en,
    description: product.price
      ? `${product.name_en} at ${formatRupees(product.price)} per ${formatUnit(product.unit)}. Part of our ${product.category?.name_en ?? ""} range from licensed Sivakasi manufacturers.`
      : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = product.category_id ? await getRelatedProducts(product.category_id, product.id) : [];
  const images = product.image_url ? [product.image_url, ...(product.image_urls ?? [])] : [];
  const isUnavailable = product.status === "unavailable";
  const isCallForRate = !product.price;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav className="mb-4 text-xs text-muted">
        <Link href="/">Home</Link> / <Link href="/products">Products</Link>
        {product.category && (
          <>
            {" "}
            / <Link href={`/products/${product.category.slug}`}>{product.category.name_en}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={images} name={product.name_en} category={product.category?.name_en ?? ""} />

        <div className="pb-24 md:pb-0">
          <div className="mb-1 flex flex-wrap gap-1.5">
            {!product.is_discountable && <Badge variant="net-rate" />}
            {product.is_bestseller && <Badge variant="bestseller" />}
            {isUnavailable && <Badge variant="unavailable" />}
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">{product.name_en}</h1>
          {product.name_ta && (
            <p lang="ta" className="mt-1 text-base text-muted">
              {product.name_ta}
            </p>
          )}
          {product.category && (
            <Link
              href={`/products/${product.category.slug}`}
              className="mt-2 inline-block text-xs font-medium text-maroon"
            >
              {product.category.name_en}
            </Link>
          )}

          <div className="mt-4">
            {isCallForRate ? (
              <p className="text-ink-soft">
                Call us for the rate on this item —{" "}
                <a href={`tel:+${siteConfig.operator.phoneE164}`} className="font-semibold text-maroon">
                  {siteConfig.operator.phoneDisplay}
                </a>
              </p>
            ) : (
              <p className="tabular-nums">
                <span className="text-3xl font-bold text-ink">{formatRupees(product.price!)}</span>{" "}
                <span className="text-sm text-muted">per {formatUnit(product.unit)}</span>
              </p>
            )}
          </div>

          {isUnavailable ? (
            <div className="mt-6">
              <p className="mb-3 text-sm text-ink-soft">This item is currently unavailable.</p>
              <a
                href={`https://wa.me/${siteConfig.operator.phoneE164}?text=${encodeURIComponent(
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

          <p className="mt-6 text-xs text-muted">
            Fireworks are explosives — use only under adult supervision and follow the safety instructions.{" "}
            <Link href="/safety" className="font-medium text-maroon">
              Read safety guidance →
            </Link>
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
