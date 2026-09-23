"use client";

import { useState } from "react";
import { ProductDetailActions } from "@/components/product/product-detail-actions";
import { SparklerIcon } from "@/components/marketing/sparkler-icon";
import { formatRupees, formatUnit } from "@/lib/format";
import type { ComboVarietyOption } from "@/lib/combo-packs";

interface Props {
  packName: string;
  varieties: ComboVarietyOption[];
  initialVarietyId: string;
  unit: string;
}

/**
 * Every variety's full data (price, items) is already on the page from the
 * initial server render — switching tiers here is pure client state, never
 * a network request or navigation, so it's instant. The URL is kept in sync
 * via history.replaceState (silent — no Next.js route transition, no
 * re-fetch) so refresh/share/back-button still land on the right variety.
 */
export function ComboVarietySwitcher({ packName, varieties, initialVarietyId, unit }: Props) {
  const [selectedId, setSelectedId] = useState(initialVarietyId);
  const selected = varieties.find((v) => v.id === selectedId) ?? varieties[0];

  function selectVariety(v: ComboVarietyOption) {
    if (v.id === selectedId) return;
    setSelectedId(v.id);
    window.history.replaceState(null, "", `/s/sri-ram-crackers/p/${v.slug}`);
  }

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">
        {packName} — {selected.tierLabel}
      </h1>

      {varieties.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {varieties.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => selectVariety(v)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                v.id === selectedId
                  ? "border-maroon bg-maroon text-on-fill"
                  : "border-border text-ink-soft hover:border-maroon-ink"
              }`}
            >
              {v.tierLabel}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        <div className="flex flex-wrap items-baseline gap-2 tabular-nums">
          <span className="text-3xl font-bold text-ink">{formatRupees(selected.sellingPrice)}</span>{" "}
          <span className="text-sm text-muted">per {formatUnit(unit)}</span>
          <SparklerIcon size={18} />
        </div>
      </div>

      <div className="mt-6">
        <ProductDetailActions
          key={selected.id}
          productId={selected.id}
          sku={`COMBO-${selected.slug.toUpperCase()}`}
          price={selected.sellingPrice}
          name={`${packName} — ${selected.tierLabel}`}
        />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-display text-base font-semibold text-ink">What&apos;s inside this pack</h2>
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
          {selected.itemGroups.map((group) => (
            <div key={group.categoryName}>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{group.categoryName}</h3>
              <ul className="flex flex-col gap-1">
                {group.items.map((item, i) => (
                  <li key={i} className="flex justify-between text-sm text-ink-soft">
                    <span>
                      {item.name_en}
                      {item.name_ta && <span lang="ta"> ({item.name_ta})</span>}
                    </span>
                    <span className="tabular-nums font-medium text-ink">× {item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-2 text-right text-xs text-muted">{selected.totalItems} items total</p>
      </div>
    </>
  );
}
