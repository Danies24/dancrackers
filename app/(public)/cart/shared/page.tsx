import type { Metadata } from "next";
import Link from "next/link";
import { decodeCartItems } from "@/lib/cart-share";
import { getSharedCart } from "@/lib/cart-share-store";
import { resolveSharedCart } from "@/lib/cart-share-resolve";
import { getCanonicalUrl, getSiteUrl, brandConfig } from "@/config/brandConfig";
import { SharedCartView, type SharedCartEditableLine } from "@/components/cart/shared-cart-client";
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

  const { shop, lines, droppedCount } = cart;

  const initialLines: SharedCartEditableLine[] = lines.map((l) => ({
    productId: l.product.id,
    slug: l.product.slug,
    sku: l.product.sku,
    name_en: l.product.name_en,
    name_ta: l.product.name_ta,
    image_url: l.product.image_url,
    unit: l.product.unit,
    price: l.product.price!,
    isDiscountable: l.product.is_discountable,
    mrp: l.product.mrp,
    categoryName: l.product.category?.name_en ?? "Other",
    qty: l.qty,
  }));

  return (
    <SharedCartView
      shop={{ id: shop.id, slug: shop.slug, name: shop.name_en }}
      initialLines={initialLines}
      droppedCount={droppedCount}
    />
  );
}
