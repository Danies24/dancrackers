"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface Product {
  id: string;
  sku: string;
  name_en: string;
  image_url: string | null;
}

interface Classified {
  file: File;
  sku: string;
  product: Product;
}

interface Invalid {
  file: File;
  sku: string;
  product: Product;
  reason: string;
}

interface Unmatched {
  file: File;
  sku: string;
}

interface UploadFailure extends Classified {
  error: string;
}

interface UploadResults {
  succeeded: Classified[];
  failed: UploadFailure[];
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;
const UPLOAD_CONCURRENCY = 4;

function normalizeSku(filename: string): string {
  return filename.replace(/\.[^.]+$/, "").trim().toUpperCase();
}

export default function BulkPhotosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<UploadResults | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data.products ?? []);
    } finally {
      setLoadingProducts(false);
    }
  }

  const skuMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.sku.trim().toUpperCase(), p));
    return map;
  }, [products]);

  const { willUploadNew, willOverwrite, unmatched, invalid } = useMemo(() => {
    const skuCounts = new Map<string, number>();
    const entries = files.map((file) => {
      const sku = normalizeSku(file.name);
      const product = skuMap.get(sku);
      if (product) skuCounts.set(sku, (skuCounts.get(sku) ?? 0) + 1);
      return { file, sku, product };
    });

    const willUploadNew: Classified[] = [];
    const willOverwrite: Classified[] = [];
    const unmatched: Unmatched[] = [];
    const invalid: Invalid[] = [];

    entries.forEach(({ file, sku, product }) => {
      if (!product) {
        unmatched.push({ file, sku });
        return;
      }
      if ((skuCounts.get(sku) ?? 0) > 1) {
        invalid.push({ file, sku, product, reason: "Duplicate SKU — more than one selected file matches this product" });
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        invalid.push({ file, sku, product, reason: `Unsupported file type (${file.type || "unknown"})` });
        return;
      }
      if (file.size > MAX_BYTES) {
        invalid.push({ file, sku, product, reason: `Too large (${(file.size / 1024 / 1024).toFixed(1)}MB, max 8MB)` });
        return;
      }
      if (product.image_url) willOverwrite.push({ file, sku, product });
      else willUploadNew.push({ file, sku, product });
    });

    return { willUploadNew, willOverwrite, unmatched, invalid };
  }, [files, skuMap]);

  const matched = [...willUploadNew, ...willOverwrite];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    setFiles(list ? Array.from(list) : []);
    setResults(null);
  }

  async function uploadOne(item: Classified): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("kind", "image");
      const res = await fetch(`/api/admin/products/${item.product.id}/media`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data?.error?.message ?? "Upload failed." };

      const patchRes = await fetch(`/api/admin/products/${item.product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: data.url }),
      });
      if (!patchRes.ok) {
        const patchData = await patchRes.json().catch(() => null);
        return { ok: false, error: patchData?.error?.message ?? "Uploaded but could not save it to the product." };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error." };
    }
  }

  async function runUpload(items: Classified[]) {
    setUploading(true);
    setProgress({ done: 0, total: items.length });
    const succeeded: Classified[] = [];
    const failed: UploadFailure[] = [];

    for (let i = 0; i < items.length; i += UPLOAD_CONCURRENCY) {
      const chunk = items.slice(i, i + UPLOAD_CONCURRENCY);
      const outcomes = await Promise.all(chunk.map(async (item) => ({ item, outcome: await uploadOne(item) })));
      outcomes.forEach(({ item, outcome }) => {
        if (outcome.ok) succeeded.push(item);
        else failed.push({ ...item, error: outcome.error });
      });
      setProgress((p) => ({ ...p, done: p.done + chunk.length }));
    }

    setResults({ succeeded, failed });
    setUploading(false);
    fetchProducts();
  }

  function retryFailed() {
    if (!results || results.failed.length === 0) return;
    runUpload(results.failed.map((f) => ({ file: f.file, sku: f.sku, product: f.product })));
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink">Bulk photo upload</h1>
        <Link href="/admin/products" className="text-sm font-semibold text-maroon-ink">
          ← Products
        </Link>
      </div>
      <p className="mb-4 text-sm text-muted">
        Select photo files named after their product SKU (e.g. <span className="font-mono">047.jpg</span>) — each
        one is matched to a product automatically. JPEG/PNG/WebP, up to 8MB each.
      </p>

      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading || loadingProducts}
        className="mb-4 block text-sm"
      />

      {loadingProducts && <p className="text-sm text-muted">Loading products…</p>}

      {results && (
        <div
          className={`mb-4 rounded-lg border p-4 text-sm ${
            results.failed.length > 0 ? "border-amber/30 bg-gold-tint" : "border-teal/30 bg-teal-tint"
          }`}
        >
          <p className="font-semibold text-ink">
            {results.succeeded.length} uploaded{results.failed.length > 0 ? `, ${results.failed.length} failed` : ""}.
          </p>
          {results.failed.length > 0 && (
            <>
              <div className="mt-2 flex flex-col gap-1 text-xs text-ink-soft">
                {results.failed.map((f) => (
                  <Row key={f.sku}>
                    {f.sku} — {f.file.name}: {f.error}
                  </Row>
                ))}
              </div>
              <button
                onClick={retryFailed}
                disabled={uploading}
                className="mt-2 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-ink disabled:opacity-50"
              >
                Retry failed
              </button>
            </>
          )}
        </div>
      )}

      {uploading && (
        <p className="mb-4 text-sm text-muted">
          Uploading… {progress.done} / {progress.total}
        </p>
      )}

      {files.length > 0 && !uploading && (
        <div className="flex flex-col gap-4">
          <Section title={`${willUploadNew.length} new photo(s) ready to upload`}>
            {willUploadNew.map((m) => (
              <Row key={m.product.id}>
                {m.sku} — {m.product.name_en}
              </Row>
            ))}
          </Section>

          <Section title={`${willOverwrite.length} will replace an existing photo`}>
            {willOverwrite.map((m) => (
              <Row key={m.product.id}>
                {m.sku} — {m.product.name_en}
              </Row>
            ))}
          </Section>

          <Section title={`${unmatched.length} file(s) with no matching SKU`}>
            {unmatched.map((u, i) => (
              <Row key={i}>{u.file.name} — no product with SKU &quot;{u.sku}&quot;</Row>
            ))}
          </Section>

          <Section title={`${invalid.length} file(s) with a problem`}>
            {invalid.map((n, i) => (
              <Row key={i}>
                {n.sku} — {n.file.name}: {n.reason}
              </Row>
            ))}
          </Section>

          <button
            onClick={() => runUpload(matched)}
            disabled={matched.length === 0}
            className="rounded-md bg-maroon py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Upload {matched.length} photo{matched.length === 1 ? "" : "s"}
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <h2 className="mb-2 text-sm font-bold text-ink">{title}</h2>
      <div className="max-h-48 overflow-y-auto text-xs text-ink-soft">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <p className="border-b border-border/50 py-1 font-mono">{children}</p>;
}
