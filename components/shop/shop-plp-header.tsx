import Image from "next/image";
import type { ShopRow, ShopMerchandising, ShopOffer } from "@/lib/shops";
import { ShopOfferPager } from "@/components/shop/shop-offer-pager";

/**
 * The shop PLP's dark hero header (Swiggy-redesign plan) — deliberately
 * dark in BOTH site themes (--shop-header-bg), so every accent chip below
 * uses a hardcoded bright color tuned for a dark ground rather than the
 * theme-toggled --teal/--teal-ink tokens, which would go low-contrast here
 * under light mode (their light-mode variant is tuned for a light card).
 *
 * No star rating is shown — this app has no reviews/orders data to back
 * one, and a fabricated number would be worse than none.
 */
export function ShopPlpHeader({
  shop,
  merchandising,
  offers,
  maxDiscountPercent,
}: {
  shop: ShopRow;
  merchandising: ShopMerchandising;
  offers: ShopOffer[];
  maxDiscountPercent: number;
}) {
  return (
    <section className="bg-shop-header-bg px-4 pb-4 pt-4 text-white" style={{ borderRadius: "0 0 22px 22px" }}>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3">
          {shop.logo_url ? (
            <Image
              src={shop.logo_url}
              alt={shop.name_en}
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-lg font-bold text-on-fill">
              {shop.name_en.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            {shop.name_ta && (
              <p lang="ta" className="truncate text-xs text-white/70">
                {shop.name_ta}
              </p>
            )}
            <h1 className="truncate font-display text-lg font-bold">{shop.name_en}</h1>
            {shop.tagline && <p className="mt-0.5 truncate text-xs font-bold" style={{ color: "#ffc857" }}>{shop.tagline}</p>}
          </div>
        </div>

        {(maxDiscountPercent > 0 || merchandising.locationLabel || merchandising.dispatchLabel) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {maxDiscountPercent > 0 && (
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={{ background: "rgba(32,214,163,0.18)", color: "#5eeac2" }}
              >
                Up to {maxDiscountPercent}% OFF
              </span>
            )}
            {merchandising.locationLabel && (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/85">
                📍 {merchandising.locationLabel}
              </span>
            )}
            {merchandising.dispatchLabel && (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/85">
                🚚 {merchandising.dispatchLabel}
              </span>
            )}
          </div>
        )}

        {merchandising.specialties.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {merchandising.specialties.map((s) => (
              <span key={s} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">
                {s}
              </span>
            ))}
          </div>
        )}

        {offers.length > 0 && (
          <div className="mt-3">
            <ShopOfferPager offers={offers} />
          </div>
        )}
      </div>
    </section>
  );
}
