"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";
import { computeProductPricing } from "@/lib/pricing";
import { formatRupees } from "@/lib/format";
import type { Database } from "@/types/database";
import type { PricingSettings } from "@/lib/pricing-settings";

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category: { id: string; slug: string; name_en: string } | null;
};

type StatusFilter = "all" | "active" | "unavailable" | "archived";
type TypeFilter = "all" | "discountable" | "net-rate";

function priceOf(p: Product, supplierDiscountPercent: number) {
  return computeProductPricing({
    mrp: p.mrp,
    isDiscountable: p.is_discountable,
    discountPercent: Number(p.discount_percent),
    netMarkupPercent: Number(p.net_markup_percent),
    supplierDiscountPercent,
  });
}

function csvCell(v: unknown): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

/**
 * The one screen to check every product's numbers: PDF rate in, Sree Sai
 * Ram price and commission out. Every numeric edit auto-saves on blur (the
 * repo's established pattern — see the original products-table.tsx) rather
 * than a separate draft/Save-Discard step; "pending" rows (mid-save) stand
 * in for an "unsaved changes" filter under that model.
 */
export function ProductsTable({
  initialProducts,
  initialPricingSettings,
}: {
  initialProducts: Product[];
  initialPricingSettings: PricingSettings;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [supplierDiscountPercent, setSupplierDiscountPercent] = useState(
    initialPricingSettings.supplierDiscountPercent,
  );
  const [savingSupplierPercent, setSavingSupplierPercent] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [needsPhotoOnly, setNeedsPhotoOnly] = useState(false);
  const [commissionIssuesOnly, setCommissionIssuesOnly] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDiscount, setBulkDiscount] = useState("");
  const [bulkMarkup, setBulkMarkup] = useState("");
  const { show } = useToast();

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.category) map.set(p.category.id, p.category.name_en);
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [products]);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (
          search &&
          !(
            p.name_en.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase())
          )
        )
          return false;
        if (categoryFilter !== "all" && p.category_id !== categoryFilter) return false;
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (typeFilter === "discountable" && !p.is_discountable) return false;
        if (typeFilter === "net-rate" && p.is_discountable) return false;
        if (needsPhotoOnly && p.image_url) return false;
        if (commissionIssuesOnly) {
          const { commission } = priceOf(p, supplierDiscountPercent);
          if (commission == null || commission > 0) return false;
        }
        return true;
      }),
    [products, search, categoryFilter, statusFilter, typeFilter, needsPhotoOnly, commissionIssuesOnly, supplierDiscountPercent],
  );

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, p) => {
          const { customerPrice, supplierPrice, commission } = priceOf(p, supplierDiscountPercent);
          acc.customer += customerPrice ?? 0;
          acc.supplier += supplierPrice ?? 0;
          acc.commission += commission ?? 0;
          return acc;
        },
        { customer: 0, supplier: 0, commission: 0 },
      ),
    [filtered, supplierDiscountPercent],
  );

  async function patch(id: string, fields: Record<string, unknown>) {
    setPendingIds((s) => new Set(s).add(id));
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) {
        show(data?.error?.message ?? "Could not save.");
        return;
      }
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data.product } : p)));
    } finally {
      setPendingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  }

  async function saveSupplierPercent() {
    setSavingSupplierPercent(true);
    try {
      const res = await fetch("/api/admin/pricing-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierDiscountPercent }),
      });
      if (!res.ok) {
        show("Could not save the supplier discount.");
        return;
      }
      show("Supplier discount saved.");
    } finally {
      setSavingSupplierPercent(false);
    }
  }

  async function applyBulk(field: "discountPercent" | "netMarkupPercent", value: number, scope: "filtered" | "selected") {
    const ids = scope === "selected" && selected.size > 0 ? [...selected] : filtered.map((p) => p.id);
    if (ids.length === 0) return;
    const res = await fetch("/api/admin/products/bulk-pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: ids, [field]: value }),
    });
    const data = await res.json();
    if (!res.ok) {
      show(data?.error?.message ?? "Bulk update failed.");
      return;
    }
    const byId = new Map<string, { id: string; price: number | null; discount_percent: number; net_markup_percent: number }>(
      (data.products ?? []).map((p: { id: string; price: number | null; discount_percent: number; net_markup_percent: number }) => [p.id, p]),
    );
    setProducts((prev) => prev.map((p) => (byId.has(p.id) ? { ...p, ...byId.get(p.id) } : p)));
    show(`Updated ${data.updated} product${data.updated === 1 ? "" : "s"}.`);
  }

  function exportCsv() {
    const header = [
      "SKU", "Name EN", "Name TA", "Category", "Unit", "MRP", "Supplier price", "Discountable",
      "Discount %", "Markup %", "Customer price", "Commission", "Commission % of bill", "Status", "Bestseller",
    ];
    const rows = filtered.map((p) => {
      const { customerPrice, supplierPrice, commission } = priceOf(p, supplierDiscountPercent);
      const commissionPct = customerPrice ? ((commission ?? 0) / customerPrice) * 100 : 0;
      return [
        p.sku, p.name_en, p.name_ta ?? "", p.category?.name_en ?? "", p.unit, p.mrp ?? "", supplierPrice ?? "",
        p.is_discountable ? "yes" : "no", p.is_discountable ? p.discount_percent : "",
        p.is_discountable ? "" : p.net_markup_percent, customerPrice ?? "", commission ?? "",
        customerPrice ? commissionPct.toFixed(1) : "", p.status, p.is_bestseller ? "yes" : "no",
      ];
    });
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* Header strip: global supplier % + bulk pricing actions + live totals */}
      <div className="mb-3 flex flex-wrap items-end gap-4 rounded-lg border border-border bg-cream p-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">Supplier discount %</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={supplierDiscountPercent}
              onChange={(e) => setSupplierDiscountPercent(Number(e.target.value))}
              className="w-20 rounded border border-border px-2 py-1 text-sm tabular-nums"
            />
            <button
              onClick={saveSupplierPercent}
              disabled={savingSupplierPercent}
              className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-ink disabled:opacity-50"
            >
              {savingSupplierPercent ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">Bulk set discount % (discountable rows)</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={bulkDiscount}
              onChange={(e) => setBulkDiscount(e.target.value)}
              placeholder="e.g. 80"
              className="w-20 rounded border border-border px-2 py-1 text-sm tabular-nums"
            />
            <button
              onClick={() => bulkDiscount !== "" && applyBulk("discountPercent", Number(bulkDiscount), "filtered")}
              className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-ink"
            >
              Apply to shown ({filtered.length})
            </button>
            <button
              onClick={() => bulkDiscount !== "" && applyBulk("discountPercent", Number(bulkDiscount), "selected")}
              disabled={selected.size === 0}
              className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-ink disabled:opacity-40"
            >
              Apply to selected ({selected.size})
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted">Bulk set net markup % (net-rate rows)</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={bulkMarkup}
              onChange={(e) => setBulkMarkup(e.target.value)}
              placeholder="e.g. 10"
              className="w-20 rounded border border-border px-2 py-1 text-sm tabular-nums"
            />
            <button
              onClick={() => bulkMarkup !== "" && applyBulk("netMarkupPercent", Number(bulkMarkup), "filtered")}
              className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-ink"
            >
              Apply to shown ({filtered.length})
            </button>
            <button
              onClick={() => bulkMarkup !== "" && applyBulk("netMarkupPercent", Number(bulkMarkup), "selected")}
              disabled={selected.size === 0}
              className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-ink disabled:opacity-40"
            >
              Apply to selected ({selected.size})
            </button>
          </div>
        </div>

        <div className="ml-auto flex gap-4 text-right text-xs">
          <div>
            <p className="text-muted">Customer total</p>
            <p className="tabular-nums font-bold text-ink">{formatRupees(totals.customer)}</p>
          </div>
          <div>
            <p className="text-muted">Pay Supplier</p>
            <p className="tabular-nums font-bold text-ink">{formatRupees(totals.supplier)}</p>
          </div>
          <div>
            <p className="text-muted">My commission</p>
            <p className={`tabular-nums font-bold ${totals.commission > 0 ? "text-teal-ink" : "text-red-ink"}`}>
              {formatRupees(totals.commission)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU"
          className="h-9 flex-1 min-w-[180px] rounded-md border border-border bg-surface px-3 text-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-surface px-2 text-sm"
        >
          <option value="all">All categories</option>
          {categories.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="h-9 rounded-md border border-border bg-surface px-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">active</option>
          <option value="unavailable">unavailable</option>
          <option value="archived">archived</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="h-9 rounded-md border border-border bg-surface px-2 text-sm"
        >
          <option value="all">Discountable + net-rate</option>
          <option value="discountable">Discountable only</option>
          <option value="net-rate">Net-rate only</option>
        </select>
        <label className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-xs">
          <input type="checkbox" checked={needsPhotoOnly} onChange={(e) => setNeedsPhotoOnly(e.target.checked)} />
          Needs photo
        </label>
        <label className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-xs">
          <input
            type="checkbox"
            checked={commissionIssuesOnly}
            onChange={(e) => setCommissionIssuesOnly(e.target.checked)}
          />
          Commission ≤ 0
        </label>
        <button onClick={exportCsv} className="h-9 rounded-md border border-border bg-surface px-3 text-xs font-semibold text-ink">
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-cream text-left text-xs text-muted">
              <th className="p-2"></th>
              <th className="p-2">Photo</th>
              <th className="p-2">SKU</th>
              <th className="p-2">Name (EN)</th>
              <th className="p-2">Name (TA)</th>
              <th className="p-2">Category</th>
              <th className="p-2">Unit</th>
              <th className="p-2">MRP / PDF rate</th>
              <th className="p-2" title="Supplier PDF — 90% off for discount items, net rate for net items">
                Supplier price
              </th>
              <th className="p-2">Net rate</th>
              <th className="p-2">Discount % / Markup %</th>
              <th className="p-2">Customer price</th>
              <th className="p-2">My commission</th>
              <th className="p-2">Commission %</th>
              <th className="p-2">Status</th>
              <th className="p-2">★</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const { customerPrice, supplierPrice, commission } = priceOf(p, supplierDiscountPercent);
              const commissionPct = customerPrice ? ((commission ?? 0) / customerPrice) * 100 : null;
              const warn = p.is_discountable && Number(p.discount_percent) >= supplierDiscountPercent;
              const pending = pendingIds.has(p.id);
              return (
                <tr
                  key={p.id}
                  className={`border-b border-border/50 ${warn ? "bg-red/5" : ""} ${pending ? "opacity-60" : ""}`}
                >
                  <td className="p-2">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelected(p.id)} />
                  </td>
                  <td className="p-2">
                    <div className="relative h-10 w-10 overflow-hidden rounded bg-cream">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name_en} fill className="object-cover" sizes="40px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-amber">
                          none
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-2 font-mono text-xs">
                    <Link href={`/admin/products/${p.id}`} className="text-maroon-ink hover:underline">
                      {p.sku}
                    </Link>
                  </td>
                  <td className="max-w-[160px] truncate p-2">{p.name_en}</td>
                  <td className="max-w-[120px] truncate p-2 text-xs text-muted">{p.name_ta}</td>
                  <td className="p-2 text-xs">{p.category?.name_en}</td>
                  <td className="p-2 text-xs">{p.unit}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      defaultValue={p.mrp ?? ""}
                      onBlur={(e) => {
                        const v = e.target.value === "" ? null : Number(e.target.value);
                        if (v !== p.mrp) patch(p.id, { mrp: v });
                      }}
                      className="w-20 rounded border border-border px-1.5 py-1 text-right tabular-nums"
                    />
                  </td>
                  <td className="p-2 tabular-nums text-muted" title="Supplier PDF — 90% off for discount items, net rate for net items">
                    {supplierPrice != null ? formatRupees(supplierPrice) : "—"}
                  </td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={!p.is_discountable}
                      onChange={(e) => patch(p.id, { is_discountable: !e.target.checked })}
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        defaultValue={p.is_discountable ? p.discount_percent : p.net_markup_percent}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (p.is_discountable) {
                            if (v !== p.discount_percent) patch(p.id, { discount_percent: v });
                          } else if (v !== p.net_markup_percent) {
                            patch(p.id, { net_markup_percent: v });
                          }
                        }}
                        className="w-16 rounded border border-border px-1.5 py-1 text-right tabular-nums"
                      />
                      <span className="text-xs text-muted">{p.is_discountable ? "% off" : "% markup"}</span>
                    </div>
                    {warn && <p className="mt-1 text-[10px] font-semibold text-red-ink">Discount ≥ supplier %</p>}
                  </td>
                  <td className="p-2 tabular-nums font-bold text-ink">
                    {customerPrice != null ? formatRupees(customerPrice) : "Ask for price"}
                  </td>
                  <td className={`p-2 tabular-nums font-semibold ${commission != null && commission > 0 ? "text-teal-ink" : "text-red-ink"}`}>
                    {commission != null ? formatRupees(commission) : "—"}
                  </td>
                  <td className="p-2 tabular-nums text-xs text-muted">
                    {commissionPct != null ? `${commissionPct.toFixed(1)}%` : "—"}
                  </td>
                  <td className="p-2">
                    <select
                      defaultValue={p.status}
                      onChange={(e) => patch(p.id, { status: e.target.value })}
                      className="rounded border border-border px-1 py-1 text-xs"
                    >
                      <option value="active">active</option>
                      <option value="unavailable">unavailable</option>
                      <option value="archived">archived</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      defaultChecked={p.is_bestseller}
                      onChange={(e) => patch(p.id, { is_bestseller: e.target.checked })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">{filtered.length} of {products.length} products shown</p>
    </div>
  );
}
