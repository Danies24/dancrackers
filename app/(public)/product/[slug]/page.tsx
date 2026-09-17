import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDetailActions } from "@/components/product/product-detail-actions";
import { ProductCard } from "@/components/product/product-card";
import { ProductViewTracker } from "@/components/product/product-view-tracker";
import { SparklerIcon } from "@/components/marketing/sparkler-icon";
import { Badge } from "@/components/ui/badge";
import { formatRupees, formatUnit } from "@/lib/format";
import { getProductBySlug, getRelatedProducts } from "@/lib/data";
import { brandConfig, getPhoneDisplay, getPhoneE164 } from "@/config/brandConfig";

const DISPLAY_DISCOUNT_LABEL = `${Math.round(brandConfig.marketingDiscountPercent)}% OFF`;

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

  const related = !product.combo && product.category_id ? await getRelatedProducts(product.category_id, product.id) : [];
  const images = product.image_url ? [product.image_url, ...(product.image_urls ?? [])] : [];
  const isUnavailable = product.status === "unavailable";
  const isCallForRate = !product.price;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <ProductViewTracker
        productId={product.id}
        sku={product.sku}
        name={product.name_en}
        category={product.category?.name_en}
        price={product.price}
      />
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
          <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">{product.name_en}</h1>
          {product.name_ta && (
            <p lang="ta" className="mt-1 text-base text-muted">
              {product.name_ta}
            </p>
          )}
          {product.combo?.tagline && <p className="mt-1 text-sm text-ink-soft">{product.combo.tagline}</p>}
          {!product.combo && product.category && (
            <Link
              href={`/products/${product.category.slug}`}
              className="mt-2 inline-block text-xs font-medium text-maroon-ink"
            >
              {product.category.name_en}
            </Link>
          )}

          {product.combo && product.combo.varieties.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.combo.varieties.map((v) => (
                <Link
                  key={v.id}
                  href={`/product/${v.slug}`}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    v.id === product.combo!.varietyId
                      ? "border-maroon bg-maroon text-on-fill"
                      : "border-border text-ink-soft hover:border-maroon-ink"
                  }`}
                >
                  {v.tierLabel}
                </Link>
              ))}
            </div>
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

          {product.combo ? (
            <div className="mt-6">
              <h2 className="mb-3 font-display text-base font-semibold text-ink">What&apos;s inside this pack</h2>
              <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
                {product.combo.itemGroups.map((group) => (
                  <div key={group.categoryName}>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      {group.categoryName}
                    </h3>
                    <ul className="flex flex-col gap-1">
                      {group.items.map((item, i) => (
                        <li key={i} className="flex justify-between text-sm text-ink-soft">
                          <span>
                            {item.name_en}
                            {item.name_ta && <span lang="ta"> ({item.name_ta})</span>}
                          </span>
                          <span className="tabular-nums font-medium text-ink">× {item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-right text-xs text-muted">{product.combo.totalItems} items total</p>
            </div>
          ) : (
            product.description && <p className="mt-6 text-sm leading-relaxed text-ink-soft">{product.description}</p>
          )}

          <p className="mt-6 text-xs text-muted">
            Fireworks are explosives — use only under adult supervision and follow the safety instructions.{" "}
            <Link href="/safety" className="font-medium text-maroon-ink">
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
