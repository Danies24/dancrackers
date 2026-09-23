import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/lib/format";
import type { ShopRow } from "@/lib/shops";

export interface ShopCardData extends ShopRow {
  productCount: number;
}

/**
 * Home page "Our Shops" rail card (multi-shop spec §5.2) — deliberately the
 * same shell/border/gradient language as ComboPackCard (see
 * components/product/combo-pack-card.tsx), since a shop card is its direct
 * structural analog: a horizontally-scrolling showcase card with an image,
 * a title, a meta line and one CTA. Unlike a combo pack, a shop isn't
 * cart-addable — its only action is navigating to /s/[shopSlug], so there's
 * no cart-integration logic here at all, only the visual shell.
 */
export function ShopCard({ shop }: { shop: ShopCardData }) {
  const isComingSoon = shop.status === "coming_soon";
  const initials = shop.name_en
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const card = (
    <div
      className="group flex shrink-0 snap-start flex-col overflow-hidden rounded-[22px] p-[2px] transition-transform duration-300 ease-out sm:w-[280px] md:w-full"
      style={{ background: "var(--combo-highlight-border)" }}
    >
      <div className="flex w-[250px] flex-1 flex-col overflow-hidden rounded-[20px] bg-combo-highlight-bg sm:w-[280px] md:w-full">
        <div className={`relative aspect-square overflow-hidden bg-cream ${isComingSoon ? "opacity-50 grayscale" : ""}`}>
          {shop.logo_url || shop.banner_url ? (
            <Image
              src={shop.logo_url ?? shop.banner_url!}
              alt={shop.name_en}
              fill
              sizes="(max-width: 640px) 250px, 280px"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-primary font-display text-3xl font-bold text-on-fill">
              {initials}
            </div>
          )}
          {isComingSoon && (
            <span className="absolute left-2 top-2 rounded-full bg-combo-badge-bg px-2.5 py-1 text-[10px] font-bold tracking-wide text-combo-badge-text">
              விரைவில் / Coming soon
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          {shop.name_ta && (
            <p lang="ta" className="line-clamp-1 text-xs text-muted">
              {shop.name_ta}
            </p>
          )}
          <h3 className="line-clamp-1 text-sm font-semibold text-ink">{shop.name_en}</h3>
          {shop.tagline && <p className="line-clamp-2 text-xs text-ink-soft">{shop.tagline}</p>}

          <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted">
            <span>{shop.productCount} items</span>
            {shop.min_order_value != null && shop.min_order_value > 0 && (
              <span>
                குறைந்தபட்ச ஆர்டர் {formatRupees(shop.min_order_value)} / Min order {formatRupees(shop.min_order_value)}
              </span>
            )}
          </div>

          <div className="mt-auto pt-2">
            {isComingSoon ? (
              <Button size="full" variant="secondary" disabled>
                விரைவில் / Coming soon
              </Button>
            ) : (
              <Button size="full" variant="primary" tabIndex={-1}>
                பார்க்க / Browse
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isComingSoon) {
    return (
      <div aria-disabled="true" aria-label={`${shop.name_en} — coming soon`}>
        {card}
      </div>
    );
  }

  return (
    <Link href={`/s/${shop.slug}`} aria-label={`Browse ${shop.name_en}`}>
      {card}
    </Link>
  );
}
