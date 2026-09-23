import { notFound } from "next/navigation";
import { getShopForCurrentRequest, isShopOrderable } from "@/lib/shops";
import { ShopStickyBar } from "@/components/shop/shop-sticky-bar";
import { ShopPreviewBanner } from "@/components/shop/shop-preview-banner";
import { ShopNotOrderableBanner } from "@/components/shop/shop-not-orderable-banner";

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;
  const result = await getShopForCurrentRequest(shopSlug);
  if (!result) notFound();
  const { shop, isPreview } = result;

  return (
    <div>
      {isPreview && <ShopPreviewBanner />}
      {!isShopOrderable(shop.slug) && <ShopNotOrderableBanner />}
      <ShopStickyBar shop={shop} />
      {children}
    </div>
  );
}
