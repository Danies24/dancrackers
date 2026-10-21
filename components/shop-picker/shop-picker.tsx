"use client";

import { useEffect } from "react";
import type { ShopTile as ShopTileData } from "@/lib/shop-picker";
import { useToast } from "@/components/ui/toast";
import { trackEvent } from "@/lib/analytics";
import { AllShopsTile, ShopTile } from "@/components/shop-picker/shop-tile";
import { ContinueChip, useContinueShop } from "@/components/shop-picker/continue-chip";

function useTileHandlers() {
  const toast = useToast();
  return {
    onSelect: (slug: string) => trackEvent("shop_picker_select", { shop: slug }),
    onSoonTap: (slug: string) => {
      trackEvent("shop_picker_soon_tap", { shop: slug });
      toast.show("This shop is opening soon.");
    },
  };
}

/** Full-page "Which shop today?" picker (dark ground, 2-column grid of large tiles). */
export function ShopPicker({ tiles }: { tiles: ShopTileData[] }) {
  const target = useContinueShop();
  const { onSelect, onSoonTap } = useTileHandlers();

  useEffect(() => {
    trackEvent("shop_picker_view", { shops: tiles.length });
  }, [tiles.length]);

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-shop-header-bg px-4 pb-12 pt-8 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="text-center font-display text-3xl font-bold">Which shop today?</h1>
        <p className="mb-6 mt-1 text-center text-base text-white/70">இன்று எந்தக் கடை?</p>
        {target && <ContinueChip target={target} />}
        <div className="grid grid-cols-2 justify-items-center gap-x-4 gap-y-6">
          {tiles.map((tile) => (
            <ShopTile
              key={tile.slug}
              tile={tile}
              size="lg"
              ring={target?.slug === tile.slug}
              onSelect={() => onSelect(tile.slug)}
              onSoonTap={() => onSoonTap(tile.slug)}
            />
          ))}
          <AllShopsTile size="lg" />
        </div>
        <p className="mt-8 text-center text-xs text-white/60">Every shop has its own price list. Switch anytime.</p>
      </div>
    </section>
  );
}

/** Compact home-page row of the same tiles, above "Our Shops". */
export function ShopPickerRow({ tiles }: { tiles: ShopTileData[] }) {
  const target = useContinueShop();
  const { onSelect, onSoonTap } = useTileHandlers();
  return (
    <section className="mx-auto max-w-6xl px-4 pb-6">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Which shop today?</h2>
        <a href="/shops" className="text-sm font-semibold text-maroon-ink">
          See all
        </a>
      </div>
      <div className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 py-1 text-ink">
        {tiles.map((tile) => (
          <ShopTile
            key={tile.slug}
            tile={tile}
            size="sm"
            ring={target?.slug === tile.slug}
            onSelect={() => onSelect(tile.slug)}
            onSoonTap={() => onSoonTap(tile.slug)}
          />
        ))}
      </div>
    </section>
  );
}
