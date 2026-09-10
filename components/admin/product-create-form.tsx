"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function ProductCreateForm({ categories }: { categories: { id: string; name_en: string }[] }) {
  const router = useRouter();
  const { show } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sku: "",
    name_en: "",
    name_ta: "",
    category_id: categories[0]?.id ?? "",
    price: "",
    unit: "pcs",
    min_qty: "1",
    is_discountable: true,
    description: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: form.sku,
          name_en: form.name_en,
          name_ta: form.name_ta || undefined,
          category_id: form.category_id,
          price: form.price === "" ? null : Number(form.price),
          unit: form.unit,
          min_qty: Number(form.min_qty),
          is_discountable: form.is_discountable,
          description: form.description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        show(data?.error?.message ?? "Could not create product.");
        return;
      }
      show("Product created.");
      router.push(`/admin/products/${data.product.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="SKU" required>
        <input
          value={form.sku}
          onChange={(e) => set("sku", e.target.value)}
          required
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
      </Field>

      <Field label="Name (English)" required>
        <input
          value={form.name_en}
          onChange={(e) => set("name_en", e.target.value)}
          required
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
      </Field>

      <Field label="Name (Tamil)">
        <input
          value={form.name_ta}
          onChange={(e) => set("name_ta", e.target.value)}
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
      </Field>

      <Field label="Category" required>
        <select
          value={form.category_id}
          onChange={(e) => set("category_id", e.target.value)}
          required
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_en}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₹)">
          <input
            type="number"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          />
        </Field>
        <Field label="Unit">
          <select
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="pcs">pcs</option>
            <option value="pkt">pkt</option>
            <option value="box">box</option>
            <option value="bundle">bundle</option>
          </select>
        </Field>
      </div>

      <Field label="Minimum order quantity">
        <input
          type="number"
          min={1}
          value={form.min_qty}
          onChange={(e) => set("min_qty", e.target.value)}
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={form.is_discountable}
          onChange={(e) => set("is_discountable", e.target.checked)}
          className="h-4 w-4"
        />
        Discountable
      </label>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-surface p-2 text-sm"
        />
      </Field>

      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-md bg-maroon py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {saving ? "Creating…" : "Create Product"}
      </button>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink-soft">
        {label}
        {required && " *"}
      </label>
      {children}
    </div>
  );
}
