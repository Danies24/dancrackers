"use client";

import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category: { id: string; slug: string; name_en: string } | null;
};

/** §19.5. Inline edit of price, status and flags — every save is one PATCH. */
export function ProductsTable({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const { show } = useToast();

  const filtered = products.filter(
    (p) =>
      !search ||
      p.name_en.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  async function patch(id: string, fields: Record<string, unknown>) {
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
    show("Saved.");
  }

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or SKU"
        className="mb-3 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
      />
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-cream text-left text-xs text-muted">
              <th className="p-2">SKU</th>
              <th className="p-2">Name</th>
              <th className="p-2">Category</th>
              <th className="p-2">Price</th>
              <th className="p-2">Status</th>
              <th className="p-2">Flags</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="p-2 font-mono text-xs">
                  <Link href={`/admin/products/${p.id}`} className="text-maroon-ink hover:underline">
                    {p.sku}
                  </Link>
                </td>
                <td className="max-w-[160px] truncate p-2">
                  {p.name_en}
                  {!p.image_url && <span className="ml-1 text-[10px] text-amber">needs photo</span>}
                </td>
                <td className="p-2 text-xs">{p.category?.name_en}</td>
                <td className="p-2">
                  <input
                    type="number"
                    defaultValue={p.price ?? ""}
                    onBlur={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      if (v !== p.price) patch(p.id, { price: v });
                    }}
                    className="w-20 rounded border border-border px-1.5 py-1 text-right tabular-nums"
                  />
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
                  <label className="mr-2 inline-flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      defaultChecked={p.is_bestseller}
                      onChange={(e) => patch(p.id, { is_bestseller: e.target.checked })}
                    />
                    best
                  </label>
                  <label className="inline-flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      defaultChecked={p.is_featured}
                      onChange={(e) => patch(p.id, { is_featured: e.target.checked })}
                    />
                    featured
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">{filtered.length} products shown</p>
    </div>
  );
}
