import { notFound } from "next/navigation";
import { getShopForCurrentRequest, getShopPickerCards, isShopOrderable } from "@/lib/shops";
import { toShopTiles } from "@/lib/shop-picker";
import { RecordLastShop } from "@/components/shop-picker/record-last-shop";
import { ShopStickyBar } from "@/components/shop/shop-sticky-bar";
import { ShopPreviewBanner } from "@/components/shop/shop-preview-banner";
import { ShopNotOrderableBanner } from "@/components/shop/shop-not-orderable-banner";
import { WholesaleNoticeBanner } from "@/components/shop/wholesale-notice-banner";
import { isGurusamyShop } from "@/config/deliveryConfig";

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
  const tiles = toShopTiles(await getShopPickerCards().catch(() => []), isShopOrderable);

  return (
    <div>
      {isPreview && <ShopPreviewBanner />}
      {!isShopOrderable(shop.slug) && <ShopNotOrderableBanner />}
      {isGurusamyShop(shop.slug) && <WholesaleNoticeBanner />}
      {!isPreview && <RecordLastShop slug={shop.slug} name={shop.name_en} />}
      <ShopStickyBar shop={shop} tiles={tiles} />
      {children}
    </div>
  );
}
