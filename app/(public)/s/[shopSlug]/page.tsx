import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getShopForCurrentRequest,
  getShopPlpSections,
  getShopMerchandising,
  getShopOffers,
  getShopMaxActiveDiscountPercent,
} from "@/lib/shops";
import { ShopPlpHeader } from "@/components/shop/shop-plp-header";
import { ShopPlpClient } from "@/components/shop/shop-plp-client";
import { getCanonicalUrl } from "@/config/brandConfig";

type RouteParams = { params: Promise<{ shopSlug: string }> };

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { shopSlug } = await params;
  const result = await getShopForCurrentRequest(shopSlug);
  if (!result) return {};
  const { shop, isPreview } = result;
  return {
    title: `${shop.name_en} — Sivakasi Crackers Price List`,
    alternates: { canonical: getCanonicalUrl(`/s/${shop.slug}`) },
    // Preview access to a hidden shop must never end up indexed even though
    // it renders fully (multi-shop spec §5.3).
    robots: isPreview ? { index: false, follow: false } : undefined,
  };
}

export default async function ShopHomePage({ params }: RouteParams) {
  const { shopSlug } = await params;
  const result = await getShopForCurrentRequest(shopSlug);
  if (!result) notFound();
  const { shop } = result;

  const [sections, offers, maxDiscountPercent] = await Promise.all([
    getShopPlpSections(shop.id),
    getShopOffers(shop.id),
    getShopMaxActiveDiscountPercent(shop.id),
  ]);
  const merchandising = getShopMerchandising(shop);
  const hasAnyProducts = sections.some((s) => s.kind !== "combos" && s.products.length > 0);

  return (
    <div>
      <ShopPlpHeader shop={shop} merchandising={merchandising} offers={offers} maxDiscountPercent={maxDiscountPercent} />

      {!hasAnyProducts ? (
        <p className="py-16 text-center text-ink-soft">Our catalogue for this shop is being updated.</p>
      ) : (
        <ShopPlpClient sections={sections} shopSlug={shop.slug} shopName={shop.name_en} />
      )}
    </div>
  );
}
