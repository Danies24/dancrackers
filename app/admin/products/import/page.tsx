"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { ImportDiff } from "@/lib/csv-import";

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [csv, setCsv] = useState<string | null>(null);
  const [diff, setDiff] = useState<ImportDiff | null>(null);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; markedUnavailable: number } | null>(null);
  const [confirmMissing, setConfirmMissing] = useState(false);

  async function handleFile(file: File) {
    const text = await file.text();
    setCsv(text);
    setResult(null);
    const res = await fetch("/api/admin/products/import?dryRun=true", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: text }),
    });
    setDiff(await res.json());
  }

  async function commit() {
    if (!csv) return;
    setCommitting(true);
    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, confirmMissing }),
      });
      setResult(await res.json());
      setDiff(null);
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-xl font-semibold text-ink">Import catalogue</h1>
      <p className="mb-4 text-sm text-muted">
        Columns: sku, name_en, name_ta, category, price, unit, is_discountable, display_order (§14.5).
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="mb-4 block text-sm"
      />

      {result && (
        <div className="mb-4 rounded-lg border border-teal/30 bg-teal-tint p-4 text-sm">
          <p className="font-semibold text-teal-ink">Import committed.</p>
          <p>
            {result.created} new · {result.updated} updated · {result.markedUnavailable} marked unavailable
          </p>
          <Link href="/admin/products" className="mt-2 inline-block font-semibold text-maroon-ink">
            View products →
          </Link>
        </div>
      )}

      {diff && (
        <div className="flex flex-col gap-4">
          <Section title={`${diff.newProducts.length} new products`}>
            {diff.newProducts.map((r) => (
              <Row key={r.sku}>
                {r.sku} — {r.name_en} — {r.price != null ? `₹${r.price}` : "no price"}
              </Row>
            ))}
          </Section>

          <Section title={`${diff.priceChanges.length} price changes`}>
            {diff.priceChanges.map((c) => (
              <Row key={c.sku}>
                {c.sku} — {c.name_en}: {c.oldPrice ?? "—"} → {c.newPrice ?? "—"}
              </Row>
            ))}
          </Section>

          <Section title={`${diff.missingSkus.length} products in DB but absent from this file`}>
            <p className="mb-1 text-xs text-muted">Proposed: mark unavailable. Never deleted.</p>
            {diff.missingSkus.map((sku) => (
              <Row key={sku}>{sku}</Row>
            ))}
            {diff.missingSkus.length > 0 && (
              <label className="mt-2 flex items-center gap-2 text-xs">
                <input type="checkbox" checked={confirmMissing} onChange={(e) => setConfirmMissing(e.target.checked)} />
                Yes, mark these {diff.missingSkus.length} products unavailable on commit
              </label>
            )}
          </Section>

          <Section title={`${diff.errors.length} rows with errors`}>
            {diff.errors.map((e, i) => (
              <Row key={i}>
                Row {e.rowNumber}: {e.reason}
              </Row>
            ))}
          </Section>

          <button
            onClick={commit}
            disabled={committing}
            className="rounded-md bg-maroon py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {committing ? "Committing…" : "Commit this import"}
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
