"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatRupees } from "@/lib/format";

interface Product {
  id: string;
  sku: string;
  name_en: string;
  name_ta: string | null;
  price: number | null;
  mrp?: number | null;
  unit: string;
}

interface Item {
  id: string;
  variety_id: string;
  product_id: string;
  quantity: number;
  display_order: number;
  products: Product | null;
}

interface Variety {
  id: string;
  combo_pack_id: string;
  slug: string;
  tier_label: string;
  display_order: number;
  selling_price: number;
  supplier_cost: number;
  commission: number;
  commission_pct: number;
  total_items: number;
  items: Item[];
}

interface ComboPack {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  hero_image_url: string | null;
  badge_text: string;
  display_order: number;
  is_active: boolean;
}

export function ComboPackDetailClient({
  comboPack,
  initialVarieties,
  allProducts,
}: {
  comboPack: ComboPack;
  initialVarieties: Variety[];
  allProducts: Product[];
}) {
  const [pack, setPack] = useState(comboPack);
  const [varieties, setVarieties] = useState(initialVarieties);
  const [packSaving, setPackSaving] = useState(false);
  const [packSaved, setPackSaved] = useState(false);

  async function savePack() {
    setPackSaving(true);
    setPackSaved(false);
    const res = await fetch(`/api/admin/combo-packs/${pack.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: pack.name,
        tagline: pack.tagline,
        badge_text: pack.badge_text,
        hero_image_url: pack.hero_image_url,
        is_active: pack.is_active,
      }),
    });
    setPackSaving(false);
    if (res.ok) {
      setPackSaved(true);
      setTimeout(() => setPackSaved(false), 1500);
    }
  }

  function updateVariety(varietyId: string, patch: Partial<Variety>) {
    setVarieties((prev) => prev.map((v) => (v.id === varietyId ? { ...v, ...patch } : v)));
  }

  async function addVariety() {
    const tier = prompt("New tier label (e.g. XL)");
    if (!tier) return;
    const res = await fetch(`/api/admin/combo-packs/${pack.id}/varieties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier_label: tier }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error?.message ?? "Could not add variety.");
      return;
    }
    setVarieties((prev) => [...prev, { ...data.variety, items: [] }]);
  }

  async function deleteVariety(varietyId: string) {
    if (!confirm("Delete this variety and everything in it? This can't be undone.")) return;
    const res = await fetch(`/api/admin/combo-packs/${pack.id}/varieties/${varietyId}`, { method: "DELETE" });
    if (res.ok) setVarieties((prev) => prev.filter((v) => v.id !== varietyId));
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink">{pack.name}</h1>
        <Link href="/admin/combopacks" className="text-sm font-semibold text-maroon-ink">
          ← Combo Packs
        </Link>
      </div>
      <p className="mb-4 font-mono text-xs text-muted">/product/{"{variety-slug}"} — slug base: {pack.slug}</p>

      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-bold text-ink">Pack details</h2>
        <label className="text-sm font-medium text-ink">
          Name
          <input
            value={pack.name}
            onChange={(e) => setPack((p) => ({ ...p, name: e.target.value }))}
            className="mt-1 h-10 w-full rounded-md border border-border bg-cream px-3 text-sm"
          />
        </label>
        <label className="text-sm font-medium text-ink">
          Tagline
          <input
            value={pack.tagline ?? ""}
            onChange={(e) => setPack((p) => ({ ...p, tagline: e.target.value }))}
            className="mt-1 h-10 w-full rounded-md border border-border bg-cream px-3 text-sm"
          />
        </label>
        <label className="text-sm font-medium text-ink">
          Badge text
          <input
            value={pack.badge_text}
            onChange={(e) => setPack((p) => ({ ...p, badge_text: e.target.value }))}
            className="mt-1 h-10 w-full rounded-md border border-border bg-cream px-3 text-sm"
          />
        </label>
        <label className="text-sm font-medium text-ink">
          Hero image URL
          <input
            value={pack.hero_image_url ?? ""}
            onChange={(e) => setPack((p) => ({ ...p, hero_image_url: e.target.value }))}
            className="mt-1 h-10 w-full rounded-md border border-border bg-cream px-3 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={pack.is_active}
            onChange={(e) => setPack((p) => ({ ...p, is_active: e.target.checked }))}
            className="h-4 w-4"
          />
          Active (visible on the storefront)
        </label>
        <button
          onClick={savePack}
          disabled={packSaving}
          className="h-10 self-start rounded-full bg-maroon px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {packSaving ? "Saving…" : packSaved ? "Saved ✓" : "Save pack details"}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {varieties.map((variety) => (
          <VarietyCard
            key={variety.id}
            comboPackId={pack.id}
            variety={variety}
            allProducts={allProducts}
            onUpdate={(patch) => updateVariety(variety.id, patch)}
            onDelete={() => deleteVariety(variety.id)}
          />
        ))}
      </div>

      <button
        onClick={addVariety}
        className="mt-4 h-11 rounded-full border border-dashed border-border px-4 text-sm font-semibold text-ink-soft hover:border-maroon-ink hover:text-maroon-ink"
      >
        + Add Variety
      </button>
    </div>
  );
}

function VarietyCard({
  comboPackId,
  variety,
  allProducts,
  onUpdate,
  onDelete,
}: {
  comboPackId: string;
  variety: Variety;
  allProducts: Product[];
  onUpdate: (patch: Partial<Variety>) => void;
  onDelete: () => void;
}) {
  const [search, setSearch] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const existingProductIds = useMemo(() => new Set(variety.items.map((i) => i.product_id)), [variety.items]);
  const searchResults = useMemo(() => {
    if (search.trim().length < 2) return [];
    const q = search.trim().toLowerCase();
    return allProducts
      .filter((p) => !existingProductIds.has(p.id) && (p.name_en.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [search, allProducts, existingProductIds]);

  async function addItem(product: Product) {
    setAdding(true);
    setAddError(null);
    const res = await fetch(`/api/admin/combo-packs/${comboPackId}/varieties/${variety.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, quantity: addQty }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) {
      setAddError(data?.error?.message ?? "Could not add item.");
      return;
    }
    onUpdate({ items: [...variety.items, data.item], ...pickTotals(data.variety) });
    setSearch("");
    setAddQty(1);
  }

  async function changeQty(item: Item, quantity: number) {
    if (quantity < 1) return;
    const res = await fetch(
      `/api/admin/combo-packs/${comboPackId}/varieties/${variety.id}/items/${item.id}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity }) },
    );
    const data = await res.json();
    if (!res.ok) return;
    onUpdate({
      items: variety.items.map((i) => (i.id === item.id ? { ...i, quantity } : i)),
      ...pickTotals(data.variety),
    });
  }

  async function removeItem(item: Item) {
    const res = await fetch(`/api/admin/combo-packs/${comboPackId}/varieties/${variety.id}/items/${item.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) return;
    onUpdate({ items: variety.items.filter((i) => i.id !== item.id), ...pickTotals(data.variety) });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">{variety.tier_label}</h2>
        <button onClick={onDelete} className="text-xs font-semibold text-red">
          Delete variety
        </button>
      </div>

      {variety.items.length > 0 && (
        <table className="mb-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="pb-1 font-medium">Item</th>
              <th className="pb-1 text-right font-medium">Qty</th>
              <th className="pb-1 text-right font-medium">Line total</th>
              <th className="pb-1"></th>
            </tr>
          </thead>
          <tbody>
            {variety.items.map((item) => (
              <tr key={item.id} className="border-t border-border/60">
                <td className="py-1.5 pr-2 text-ink">{item.products?.name_en ?? "(deleted product)"}</td>
                <td className="py-1.5 text-right">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => changeQty(item, Number(e.target.value))}
                    className="h-8 w-16 rounded-md border border-border bg-cream px-2 text-right text-sm"
                  />
                </td>
                <td className="py-1.5 text-right tabular-nums text-ink">
                  {item.products?.price != null ? formatRupees(item.products.price * item.quantity) : "—"}
                </td>
                <td className="py-1.5 pl-2 text-right">
                  <button onClick={() => removeItem(item)} className="text-xs font-semibold text-red">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="relative mb-3">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name or SKU to add…"
            className="h-9 flex-1 rounded-md border border-border bg-cream px-3 text-sm"
          />
          <input
            type="number"
            min={1}
            value={addQty}
            onChange={(e) => setAddQty(Number(e.target.value))}
            className="h-9 w-16 rounded-md border border-border bg-cream px-2 text-right text-sm"
          />
        </div>
        {addError && <p className="mt-1 text-xs text-red">{addError}</p>}
        {searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-surface shadow-lg">
            {searchResults.map((p) => (
              <button
                key={p.id}
                disabled={adding}
                onClick={() => addItem(p)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-cream disabled:opacity-50"
              >
                <span>
                  {p.name_en} <span className="text-xs text-muted">({p.sku})</span>
                </span>
                <span className="tabular-nums text-xs text-muted">{p.price != null ? formatRupees(p.price) : "—"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-md bg-cream p-2.5 text-xs text-ink-soft">
        <span>
          Total items: <strong className="text-ink">{variety.total_items}</strong>
        </span>
        <span>
          Selling price: <strong className="text-ink">{formatRupees(variety.selling_price)}</strong>
        </span>
        <span>
          Pay to Sai Ram: <strong className="text-ink">{formatRupees(variety.supplier_cost)}</strong>
        </span>
        <span>
          Commission:{" "}
          <strong className={variety.commission > 0 ? "text-teal-ink" : "text-red"}>
            {formatRupees(variety.commission)} ({variety.commission_pct}%)
          </strong>
        </span>
      </div>
    </div>
  );
}

function pickTotals(variety: Variety | undefined) {
  if (!variety) return {};
  const { selling_price, supplier_cost, commission, commission_pct, total_items } = variety;
  return { selling_price, supplier_cost, commission, commission_pct, total_items };
}
