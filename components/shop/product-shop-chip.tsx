import Link from "next/link";

/**
 * The always-visible shop-name pill (multi-shop spec §5.4) — shown on a
 * product card only where products from more than one shop can appear side
 * by side (/products, /products/[groupSlug], search). Its own Link, never
 * nested inside the card's image/title links, so tapping it navigates to
 * the shop while tapping the rest of the card still opens the product.
 */
export function ProductShopChip({ shopSlug, shopName }: { shopSlug: string; shopName: string }) {
  return (
    <Link
      href={`/s/${shopSlug}`}
      onClick={(e) => e.stopPropagation()}
      className="relative z-10 mb-1 inline-block w-fit self-start rounded-full bg-maroon-tint/80 px-2 py-0.5 text-[11px] font-semibold text-maroon-ink backdrop-blur-sm"
    >
      {shopName}
    </Link>
  );
}
