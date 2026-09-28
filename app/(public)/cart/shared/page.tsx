import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { decodeCartItems } from "@/lib/cart-share";
import { getSharedCart } from "@/lib/cart-share-store";
import { resolveSharedCart, type ResolvedSharedCartLine } from "@/lib/cart-share-resolve";
import { isGurusamyShop } from "@/config/deliveryConfig";
import { getShopDeliveryConfig } from "@/config/deliveryConfig";
import { formatRupees, formatUnit } from "@/lib/format";
import { getCanonicalUrl, getSiteUrl, brandConfig } from "@/config/brandConfig";
import { SharedCartActions } from "@/components/cart/shared-cart-client";
import { Button } from "@/components/ui/button";

type SearchParams = Promise<{ s?: string; i?: string; id?: string }>;

async function loadCart(searchParams: SearchParams) {
  const { s, i, id } = await searchParams;
  if (id) {
    const stored = await getSharedCart(id);
    if (!stored) return null;
    return resolveSharedCart(stored.shopSlug, stored.items);
  }
  if (s && i) {
    return resolveSharedCart(s, decodeCartItems(i));
  }
  return null;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const cart = await loadCart(searchParams);
  const count = cart?.lines.reduce((sum, l) => sum + l.qty, 0) ?? 0;
  const title = `Kolagalam cart – ${count} item${count === 1 ? "" : "s"}`;
  const ogImage = `${getSiteUrl()}${brandConfig.brand.logo.ogImage}`;

  return {
    title,
    description: "Someone shared their Kolagalam crackers cart with you — view it and send your own enquiry.",
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description: "Someone shared their Kolagalam crackers cart with you.",
      images: [ogImage],
      url: getCanonicalUrl("/cart/shared"),
    },
  };
}

function groupByCategory(lines: ResolvedSharedCartLine[]) {
  const groups = new Map<string, { name: string; lines: ResolvedSharedCartLine[] }>();
  for (const line of lines) {
    const key = line.product.category?.id ?? "uncategorised";
    const name = line.product.category?.name_en ?? "Other";
    if (!groups.has(key)) groups.set(key, { name, lines: [] });
    groups.get(key)!.lines.push(line);
  }
  return [...groups.values()];
}

export default async function SharedCartPage({ searchParams }: { searchParams: SearchParams }) {
  const cart = await loadCart(searchParams);

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-maroon-tint text-3xl">🛒</div>
        <h1 className="font-display text-xl font-semibold text-ink">This shared cart isn&apos;t available</h1>
        <p className="text-sm text-ink-soft">
          The link may be old, or every item in it has since been removed.
        </p>
        <Link href="/products">
          <Button>Browse Crackers</Button>
        </Link>
      </div>
    );
  }

  const { shop, lines, totals, droppedCount } = cart;
  const deliveryConfig = getShopDeliveryConfig(shop.slug);
  const groups = groupByCategory(lines);
  const totalQty = lines.reduce((sum, l) => sum + l.qty, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-40">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Shared Cart <span className="text-base font-normal text-muted">({totalQty} items)</span>
      </h1>
      <Link href={`/s/${shop.slug}`} className="mt-1 inline-block text-sm font-medium text-maroon-ink hover:underline">
        from {shop.name_en} →
      </Link>

      {droppedCount > 0 && (
        <p className="mt-3 rounded-md bg-gold-tint px-3 py-2 text-xs font-medium text-gold-ink">
          {droppedCount} item{droppedCount === 1 ? "" : "s"} in this cart {droppedCount === 1 ? "is" : "are"} no longer
          available and {droppedCount === 1 ? "was" : "were"} left out.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.name}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{group.name}</h2>
            <div className="divide-y divide-border rounded-lg border border-border bg-surface">
              {group.lines.map((line) => (
                <div key={line.product.id} className="flex gap-3 p-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-cream">
                    {line.product.image_url ? (
                      <Image src={line.product.image_url} alt={line.product.name_en} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display font-semibold text-maroon-ink">
                        {line.product.name_en.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">{line.product.name_en}</p>
                    {line.product.name_ta && (
                      <p lang="ta" className="text-xs text-muted">
                        {line.product.name_ta}
                      </p>
                    )}
                    <p className="tabular-nums text-xs text-muted">
                      {formatRupees(line.product.price!)} per {formatUnit(line.product.unit)} × {line.qty}
                    </p>
                  </div>
                  <span className="self-start tabular-nums text-sm font-bold text-ink">
                    {formatRupees(line.product.price! * line.qty)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4">
        <div className="flex justify-between py-0.5 text-sm text-muted">
          <span>Item subtotal</span>
          <span className="tabular-nums">{formatRupees(totals.subtotal)}</span>
        </div>
        {deliveryConfig.packaging.enabled && (
          <div className="flex justify-between py-0.5 text-sm text-ink-soft">
            <span>Packaging charge ({deliveryConfig.packaging.percent}%)</span>
            <span className="tabular-nums">
              {totals.packagingCharge === 0 ? (
                <span className="font-semibold text-teal-ink">Free</span>
              ) : (
                formatRupees(totals.packagingCharge)
              )}
            </span>
          </div>
        )}
        <div className="flex justify-between py-0.5 text-sm text-ink-soft">
          <span>Delivery charge</span>
          <span className="tabular-nums">
            {totals.deliveryCharge === 0 ? (
              <span className="font-semibold text-teal-ink">Free</span>
            ) : (
              formatRupees(totals.deliveryCharge)
            )}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <span className="font-semibold text-ink">Total</span>
          <span className="tabular-nums text-2xl font-bold text-ink">{formatRupees(totals.grandTotal)}</span>
        </div>
      </div>

      {isGurusamyShop(shop.slug) && (
        <div className="mt-3 rounded-md bg-gold-tint px-3 py-2">
          <p lang="ta" className="text-xs font-semibold text-gold-ink">
            மொத்த விற்பனை நேரடி தொழிற்சாலை விலை – டெலிவரி கட்டணம் பொருந்தும் ({formatRupees(deliveryConfig.delivery.flatCharge)})
          </p>
          <p className="text-xs text-ink-soft">
            Wholesale factory direct sale – delivery charges applicable ({formatRupees(deliveryConfig.delivery.flatCharge)})
          </p>
        </div>
      )}

      <SharedCartActions
        shop={{ id: shop.id, slug: shop.slug, name: shop.name_en }}
        lines={lines.map((l) => ({
          productId: l.product.id,
          sku: l.product.sku,
          price: l.product.price!,
          qty: l.qty,
        }))}
      />
    </div>
  );
}
