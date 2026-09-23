"use client";

import { useRef, useState } from "react";
import type { ShopOffer } from "@/lib/shops";

/**
 * The shop PLP hero's rotating offer strip — a horizontal snap carousel of
 * `shop_offers` rows with dot indicators, matching the design mockup's
 * gold/translucent offer tiles. Renders nothing when the shop has no offers
 * yet (see lib/shops.ts's getShopOffers — empty until an admin adds any).
 */
export function ShopOfferPager({ offers }: { offers: ShopOffer[] }) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (offers.length === 0) return null;

  return (
    <div>
      <div
        ref={scrollerRef}
        className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          const card = el.children[0] as HTMLElement | undefined;
          if (card && card.offsetWidth > 0) {
            const i = Math.round(el.scrollLeft / (card.offsetWidth + 8));
            if (i !== active) setActive(i);
          }
        }}
      >
        {offers.map((offer, i) => (
          <div
            key={offer.id}
            className="shrink-0 snap-center rounded-xl px-3 py-2.5 text-xs font-bold"
            style={
              i % 2 === 0
                ? { minWidth: "168px", background: "linear-gradient(135deg, #ffd97a 0%, #ffb020 100%)", color: "#171b2e" }
                : { minWidth: "168px", background: "rgba(255,255,255,0.1)", color: "#ffffff" }
            }
          >
            {offer.label}
          </div>
        ))}
      </div>
      {offers.length > 1 && (
        <div className="mt-2 flex justify-center gap-1">
          {offers.map((offer, i) => (
            <span
              key={offer.id}
              className={`h-[3px] rounded-full transition-all ${i === active ? "w-3.5 bg-gold" : "w-1.5 bg-white/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
