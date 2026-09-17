import Link from "next/link";
import Image from "next/image";
import { formatRupees } from "@/lib/format";
import type { ComboPackSummary } from "@/lib/combo-packs";

/**
 * The storefront's premium-showcase treatment for a combo pack — a
 * distinct, named component (not a themed ProductCard) per the design
 * brief: reads as a special offer the way a marketplace visually separates
 * a sponsored/assured listing from a plain one, while staying restrained
 * ("warm, not loud" — a highlight, not a flashing discount banner). A pure
 * navigation tile: tapping it goes to the pack's default (cheapest)
 * variety page, where the normal product-page Add to Cart lives.
 */
export function ComboPackCard({ combo }: { combo: ComboPackSummary }) {
  return (
    <Link
      href={`/product/${combo.varietySlug}`}
      className="group block shrink-0 snap-start rounded-[22px] p-[2px] transition-transform duration-300 ease-out hover:-translate-y-1"
      style={{ background: "var(--combo-highlight-border)" }}
    >
      <div className="flex h-full w-[220px] flex-col overflow-hidden rounded-[20px] bg-combo-highlight-bg sm:w-[260px] md:w-full">
        <div className="relative aspect-square overflow-hidden bg-cream">
          {combo.heroImageUrl ? (
            <Image
              src={combo.heroImageUrl}
              alt={combo.name}
              fill
              sizes="(max-width: 640px) 220px, 260px"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-maroon-ink">
              {combo.name.charAt(0)}
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-combo-badge-bg px-2.5 py-1 text-[10px] font-bold tracking-wide text-combo-badge-text">
            {combo.badgeText}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-ink">{combo.name}</h3>
          {combo.tagline && <p className="line-clamp-2 text-xs text-ink-soft">{combo.tagline}</p>}
          <p className="mt-auto pt-2 text-sm text-ink-soft">
            From <span className="tabular-nums text-base font-bold text-ink">{formatRupees(combo.fromPrice)}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
