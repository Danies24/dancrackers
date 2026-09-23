"use client";

import Image from "next/image";

export interface CategoryCircleItem {
  /** Section anchor id, e.g. `cat-sparklers` — see ShopPlpClient's section ids. */
  anchorId: string;
  nameEn: string;
  imageUrl: string | null;
  count: number;
}

/**
 * Horizontal scroll of per-shop category circles — tapping one jumps to
 * that category's section via plain `scrollIntoView` (no IntersectionObserver
 * involved in the tap itself; `activeAnchorId` for the ring/highlight comes
 * from useActiveSection, driven by scroll position instead).
 */
export function ShopCategoryCircles({
  categories,
  activeAnchorId,
  onSelect,
}: {
  categories: CategoryCircleItem[];
  activeAnchorId: string | null;
  onSelect: (anchorId: string) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="scrollbar-none flex gap-3.5 overflow-x-auto px-4 py-3">
      {categories.map((c) => {
        const isActive = c.anchorId === activeAnchorId;
        return (
          <button
            key={c.anchorId}
            type="button"
            onClick={() => onSelect(c.anchorId)}
            className="flex w-14 shrink-0 flex-col items-center gap-1"
            aria-current={isActive}
          >
            <span
              className={`relative flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-full transition-colors ${
                isActive ? "border-2 border-maroon bg-maroon-tint" : "border border-border bg-secondary-bg"
              }`}
            >
              {c.imageUrl ? (
                <Image src={c.imageUrl} alt="" fill sizes="50px" className="object-cover" />
              ) : (
                <span className="font-display text-lg font-semibold text-maroon-ink">
                  {c.nameEn.trim().charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </span>
            <span
              className={`text-center text-[9px] font-semibold leading-tight ${isActive ? "text-ink" : "text-muted"}`}
            >
              {c.nameEn} ({c.count})
            </span>
          </button>
        );
      })}
    </div>
  );
}
