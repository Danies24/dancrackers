"use client";

import Link from "next/link";
import { useState } from "react";
import { formatRupees } from "@/lib/format";

interface Variety {
  id: string;
  tier_label: string;
  selling_price: number;
}

interface ComboPack {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  is_active: boolean;
  display_order: number;
  varieties: Variety[];
}

export function ComboPacksTable({ comboPacks }: { comboPacks: ComboPack[] }) {
  const [rows, setRows] = useState(comboPacks);

  async function toggleActive(pack: ComboPack) {
    setRows((prev) => prev.map((p) => (p.id === pack.id ? { ...p, is_active: !p.is_active } : p)));
    await fetch(`/api/admin/combo-packs/${pack.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !pack.is_active }),
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((pack) => (
        <div key={pack.id} className="rounded-lg border border-border bg-surface p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={`/admin/combopacks/${pack.id}`} className="text-sm font-semibold text-maroon-ink">
                {pack.name}
              </Link>
              {pack.tagline && <p className="text-xs text-muted">{pack.tagline}</p>}
              <p className="mt-1 flex flex-wrap gap-2 text-xs text-ink-soft">
                {pack.varieties.map((v) => (
                  <span key={v.id}>
                    {v.tier_label}: <strong className="tabular-nums text-ink">{formatRupees(v.selling_price)}</strong>
                  </span>
                ))}
              </p>
            </div>
            <label className="flex shrink-0 items-center gap-2 text-xs text-ink-soft">
              <input type="checkbox" checked={pack.is_active} onChange={() => toggleActive(pack)} className="h-4 w-4" />
              Active
            </label>
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-muted">No combo packs yet.</p>}
    </div>
  );
}
