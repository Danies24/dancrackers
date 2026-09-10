"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category: { id: string; slug: string; name_en: string } | null;
};

export function ProductDetailClient({
  initialProduct,
  categories,
}: {
  initialProduct: Product;
  categories: { id: string; name_en: string }[];
}) {
  const { show } = useToast();
  const [product, setProduct] = useState(initialProduct);
  const [saving, setSaving] = useState(false);
  const [pendingArchive, setPendingArchive] = useState(false);

  async function patch(fields: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) {
        show(data?.error?.message ?? "Could not save.");
        return;
      }
      setProduct((prev) => ({ ...prev, ...data.product }));
      show("Saved.");
    } finally {
      setSaving(false);
    }
  }

  const isArchived = product.status === "archived";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <Link href="/admin/products" className="text-xs text-muted hover:underline">
          ← All products
        </Link>
        <h1 className="mt-1 font-mono text-lg font-semibold text-ink">{product.sku}</h1>
      </div>

      {/* Details */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Details</h2>
        <div className="flex flex-col gap-3">
          <LabeledInput
            label="Name (English)"
            defaultValue={product.name_en}
            onBlurCommit={(v) => v !== product.name_en && patch({ name_en: v })}
          />
          <LabeledInput
            label="Name (Tamil)"
            defaultValue={product.name_ta ?? ""}
            onBlurCommit={(v) => v !== (product.name_ta ?? "") && patch({ name_ta: v || null })}
          />
          <LabeledInput
            label="SKU"
            defaultValue={product.sku}
            onBlurCommit={(v) => v !== product.sku && patch({ sku: v })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-soft">Category</label>
            <select
              defaultValue={product.category_id}
              onChange={(e) => patch({ category_id: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_en}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LabeledInput
              label="Price (₹)"
              type="number"
              defaultValue={product.price ?? ""}
              onBlurCommit={(v) => {
                const n = v === "" ? null : Number(v);
                if (n !== product.price) patch({ price: n });
              }}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-soft">Unit</label>
              <select
                defaultValue={product.unit}
                onChange={(e) => patch({ unit: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
              >
                <option value="pcs">pcs</option>
                <option value="pkt">pkt</option>
                <option value="box">box</option>
                <option value="bundle">bundle</option>
              </select>
            </div>
          </div>

          <LabeledInput
            label="Minimum order quantity"
            type="number"
            defaultValue={product.min_qty}
            onBlurCommit={(v) => Number(v) !== product.min_qty && patch({ min_qty: Number(v) })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-soft">Description</label>
            <textarea
              defaultValue={product.description ?? ""}
              rows={3}
              onBlur={(e) => e.target.value !== (product.description ?? "") && patch({ description: e.target.value || null })}
              className="w-full rounded-md border border-border bg-surface p-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-soft">Status</label>
            <select
              value={product.status}
              onChange={(e) => patch({ status: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
            >
              <option value="active">active</option>
              <option value="unavailable">unavailable</option>
              <option value="archived">archived</option>
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                defaultChecked={product.is_discountable}
                onChange={(e) => patch({ is_discountable: e.target.checked })}
              />
              Discountable
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                defaultChecked={product.is_bestseller}
                onChange={(e) => patch({ is_bestseller: e.target.checked })}
              />
              Bestseller
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                defaultChecked={product.is_featured}
                onChange={(e) => patch({ is_featured: e.target.checked })}
              />
              Featured
            </label>
          </div>
        </div>
      </section>

      {/* Media */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Photo</h2>
        <MediaUploadField
          productId={product.id}
          kind="image"
          currentUrl={product.image_url}
          onUploaded={(url) => patch({ image_url: url })}
        />
      </section>

      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Video</h2>
        <MediaUploadField
          productId={product.id}
          kind="video"
          currentUrl={product.video_url}
          onUploaded={(url) => patch({ video_url: url })}
        />
      </section>

      {/* Archive */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">
          {isArchived ? "Archived" : "Archive product"}
        </h2>
        {isArchived ? (
          <p className="text-sm text-ink-soft">
            This product is archived and hidden from the storefront. Past orders that reference it are unaffected.
          </p>
        ) : pendingArchive ? (
          <div className="rounded-md border border-red/30 bg-red/5 p-3">
            <p className="mb-2 text-sm text-ink">
              This will remove it from the storefront everywhere. Past orders won&apos;t be affected. Continue?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  patch({ status: "archived" });
                  setPendingArchive(false);
                }}
                disabled={saving}
                className="rounded-md bg-red px-3 py-1.5 text-xs font-semibold text-white"
              >
                Confirm archive
              </button>
              <button onClick={() => setPendingArchive(false)} className="text-xs text-muted underline">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setPendingArchive(true)}
            className="rounded-md border border-red/30 px-3 py-2 text-sm font-semibold text-red"
          >
            Archive product
          </button>
        )}
      </section>
    </div>
  );
}

function LabeledInput({
  label,
  defaultValue,
  type = "text",
  onBlurCommit,
}: {
  label: string;
  defaultValue: string | number;
  type?: string;
  onBlurCommit: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink-soft">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        onBlur={(e) => onBlurCommit(e.target.value)}
        className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
      />
    </div>
  );
}
