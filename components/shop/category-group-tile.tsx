import Link from "next/link";
import Image from "next/image";
import type { CategoryGroupRow } from "@/lib/category-groups";

/**
 * Home page "Shop by category" grid tile — w-full (not a fixed width) since
 * it always sits in a CSS grid cell (4 columns, no horizontal scroll) now,
 * never a horizontal scroller.
 */
export function CategoryGroupTile({ group }: { group: CategoryGroupRow }) {
  return (
    <Link
      href={`/category/${group.slug}`}
      className="flex w-full flex-col items-center gap-1.5 text-center"
    >
      <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-gold-tint">
        {group.icon_url ? (
          <Image src={group.icon_url} alt="" width={64} height={64} className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-lg font-bold text-gold-ink">{group.name_en.charAt(0)}</span>
        )}
      </span>
      {group.name_ta && (
        <span lang="ta" className="line-clamp-1 text-[11px] text-muted">
          {group.name_ta}
        </span>
      )}
      <span className="line-clamp-1 text-xs font-medium text-ink">{group.name_en}</span>
    </Link>
  );
}
