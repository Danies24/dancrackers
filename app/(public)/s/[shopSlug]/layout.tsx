import { notFound } from "next/navigation";
import { getShopForCurrentRequest } from "@/lib/shops";
import { ShopStickyBar } from "@/components/shop/shop-sticky-bar";
import { ShopPreviewBanner } from "@/components/shop/shop-preview-banner";

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
      <ShopStickyBar shop={shop} />
      {children}
    </div>
  );
}
