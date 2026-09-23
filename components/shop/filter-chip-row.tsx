"use client";

export type ShopFilterChip = "all" | "no-sound" | "kids-safe" | "under-199" | "bestseller";

const FILTER_CHIPS: Array<{ id: ShopFilterChip; label: string }> = [
  { id: "all", label: "All" },
  { id: "no-sound", label: "🔇 No Sound" },
  { id: "kids-safe", label: "🧸 Kids Safe" },
  { id: "under-199", label: "Under ₹199" },
  { id: "bestseller", label: "Bestseller" },
];

/**
 * The shop PLP's sticky filter row (Swiggy-redesign plan) — filters the
 * per-category grid sections client-side over the already-fetched catalogue
 * (see ShopPlpClient), never a new query. A "Combos" entry is deliberately
 * not one of these chips — combo packs aren't `ProductWithCategory`-shaped,
 * so tapping the Combos category circle (when the shop has any) jumps to
 * that section instead of filtering it.
 */
export function FilterChipRow({ active, onChange }: { active: ShopFilterChip; onChange: (chip: ShopFilterChip) => void }) {
  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto">
      {FILTER_CHIPS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(active === c.id ? "all" : c.id)}
          aria-pressed={active === c.id}
          className={`h-8 shrink-0 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition-colors ${
            active === c.id ? "bg-maroon text-on-fill" : "bg-secondary-bg text-ink-soft"
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
