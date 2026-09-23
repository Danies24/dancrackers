import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ShopRow } from "@/lib/shops";

/**
 * Keeps the shop name visible while scrolling a shop's own pages (multi-shop
 * spec §5.6) — sits directly under the global sticky Header (top-16 z-40, see
 * components/layout/header.tsx), one z-level lower so it tucks under it
 * rather than fighting for the same stacking position.
 */
export function ShopStickyBar({ shop }: { shop: ShopRow }) {
  return (
    <div className="sticky top-16 z-30 flex items-center gap-2 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur">
      <Link
        href="/"
        aria-label="Back to all shops"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-secondary-bg"
      >
        <ArrowLeft size={16} aria-hidden />
      </Link>
      <span className="truncate text-sm font-semibold text-ink">
        {shop.name_ta ? `${shop.name_ta} · ${shop.name_en}` : shop.name_en}
      </span>
    </div>
  );
}
