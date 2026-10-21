"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import type { ShopRow } from "@/lib/shops";
import type { ShopTile } from "@/lib/shop-picker";
import { SwitchShopSheet } from "@/components/shop-picker/switch-shop-sheet";
import { trackEvent } from "@/lib/analytics";

/**
 * Keeps the shop name visible while scrolling a shop's own pages (multi-shop
 * spec §5.6) — sits directly under the global sticky Header (top-16 z-40, see
 * components/layout/header.tsx), one z-level lower so it tucks under it
 * rather than fighting for the same stacking position. The "Switch shop"
 * pill opens the picker sheet (focus returns to it on close via Sheet's
 * focus trap).
 */
export function ShopStickyBar({ shop, tiles }: { shop: ShopRow; tiles: ShopTile[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="border-border bg-surface/95 sticky top-16 z-30 flex items-center gap-2 border-b px-4 py-2 backdrop-blur">
        <Link
          href="/"
          aria-label="Back to all shops"
          className="text-ink-soft hover:bg-secondary-bg flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        >
          <ArrowLeft size={16} aria-hidden />
        </Link>
        <span className="text-ink min-w-0 flex-1 truncate text-sm font-semibold">
          {shop.name_en}
        </span>
        <button
          type="button"
          onClick={() => {
            trackEvent("switch_sheet_open", { shop: shop.slug });
            setOpen(true);
          }}
          aria-haspopup="dialog"
          className="border-border text-ink hover:border-maroon-ink flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold"
        >
          Switch shop
          <ChevronDown size={14} aria-hidden />
        </button>
      </div>
      {/* Outside the bar: its backdrop-blur would make it the containing block for the sheet's fixed overlay. */}
      <SwitchShopSheet
        open={open}
        onClose={() => setOpen(false)}
        tiles={tiles}
        currentSlug={shop.slug}
      />
    </>
  );
}
