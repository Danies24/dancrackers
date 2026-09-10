"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { buildCaptainKitMessage } from "@/lib/whatsapp";
import { formatIST, formatRupees } from "@/lib/format";
import type { CaptainStats } from "@/lib/captain-stats";
import type { Database } from "@/types/database";

type Captain = Database["public"]["Tables"]["captains"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];

export function CaptainDetailClient({
  initialCaptain,
  recentOrders,
  stats,
  link,
  qrDataUrl,
  siteUrl,
}: {
  initialCaptain: Captain;
  recentOrders: Order[];
  stats: CaptainStats;
  link: string;
  qrDataUrl: string;
  siteUrl: string;
}) {
  const { show } = useToast();
  const [captain, setCaptain] = useState(initialCaptain);
  const [orders, setOrders] = useState(recentOrders);
  const [saving, setSaving] = useState(false);

  async function patch(fields: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/captains/${captain.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) {
        show(data?.error?.message ?? "Could not save.");
        return;
      }
      setCaptain((prev) => ({ ...prev, ...data.captain }));
      show("Saved.");
    } finally {
      setSaving(false);
    }
  }

  async function markPaid(orderId: string, paid: boolean) {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commissionPaid: paid }),
    });
    const data = await res.json();
    if (!res.ok) {
      show(data?.error?.message ?? "Could not update.");
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    show(paid ? "Marked paid." : "Marked unpaid.");
  }

  function copyKit() {
    const message = buildCaptainKitMessage(captain.code, siteUrl);
    navigator.clipboard?.writeText(message).then(() => show("Captain kit message copied."));
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <Link href="/admin/captains" className="text-xs text-muted hover:underline">
          ← All captains
        </Link>
        <h1 className="mt-1 font-mono text-lg font-semibold text-ink">{captain.code}</h1>
      </div>

      {/* Performance */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Performance</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Kpi label="Orders" value={String(stats.totalOrders)} />
          <Kpi label="Delivered" value={String(stats.deliveredOrders)} />
          <Kpi label="Customers" value={String(stats.distinctCustomers)} />
          <Kpi label="Revenue" value={formatRupees(stats.revenue)} />
          <Kpi label="Commission rate" value={`${captain.commission_rate}%`} />
          <Kpi label="Commission earned" value={formatRupees(stats.commissionEarned)} />
          <Kpi label="Commission payable" value={formatRupees(stats.commissionPayable)} alert={stats.commissionPayable > 0} />
        </div>
      </section>

      {/* Kit */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Captain kit</h2>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt={`QR code for ${captain.code}`} className="h-40 w-40 rounded-md border border-border" />
          <div className="flex-1">
            <p className="break-all font-mono text-xs text-ink-soft">{link}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={copyKit} className="rounded-md bg-maroon px-3 py-2 text-xs font-semibold text-white">
                Copy captain kit
              </button>
              <a
                href={qrDataUrl}
                download={`${captain.code}-qr.png`}
                className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-ink"
              >
                Download QR
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Details</h2>
        <div className="flex flex-col gap-3">
          <LabeledInput label="Name" defaultValue={captain.name} onBlurCommit={(v) => v !== captain.name && patch({ name: v })} />
          <LabeledInput label="Phone" defaultValue={captain.phone} onBlurCommit={(v) => v !== captain.phone && patch({ phone: v })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-soft">Commission rate (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              defaultValue={captain.commission_rate}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v) && v !== Number(captain.commission_rate)) patch({ commission_rate: v });
              }}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
            />
            <p className="text-xs text-muted">Applies to orders delivered from now on — already-delivered orders keep their frozen rate.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label="City" defaultValue={captain.city ?? ""} onBlurCommit={(v) => v !== (captain.city ?? "") && patch({ city: v || null })} />
            <LabeledInput label="Area" defaultValue={captain.area ?? ""} onBlurCommit={(v) => v !== (captain.area ?? "") && patch({ area: v || null })} />
          </div>
          <LabeledInput label="Source" defaultValue={captain.source ?? ""} onBlurCommit={(v) => v !== (captain.source ?? "") && patch({ source: v || null })} />
          <LabeledInput label="UPI ID" defaultValue={captain.upi_id ?? ""} onBlurCommit={(v) => v !== (captain.upi_id ?? "") && patch({ upi_id: v || null })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-soft">Notes</label>
            <textarea
              defaultValue={captain.notes ?? ""}
              rows={2}
              onBlur={(e) => e.target.value !== (captain.notes ?? "") && patch({ notes: e.target.value || null })}
              className="w-full rounded-md border border-border bg-surface p-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-soft">Status</label>
            <select
              value={captain.status}
              onChange={(e) => patch({ status: e.target.value })}
              disabled={saving}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
        </div>
      </section>

      {/* Recent orders */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Recent orders</h2>
        {orders.length === 0 && <p className="text-sm text-muted">No orders yet.</p>}
        <div className="flex flex-col gap-2">
          {orders.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-2 border-b border-border/50 pb-2 text-sm">
              <div>
                <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-semibold text-maroon-ink">
                  {o.order_ref}
                </Link>
                <p className="text-xs text-muted">
                  {o.status} · {formatIST(o.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="tabular-nums font-semibold text-ink">{formatRupees(Number(o.grand_total))}</p>
                {o.commission_amount != null && (
                  <button
                    onClick={() => markPaid(o.id, !o.commission_paid_at)}
                    className={`text-xs font-semibold ${o.commission_paid_at ? "text-teal-ink" : "text-amber-ink"}`}
                  >
                    {o.commission_paid_at ? "Paid ✓" : `Mark paid (${formatRupees(Number(o.commission_amount))})`}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${alert ? "border-amber/30 bg-gold-tint" : "border-border bg-cream"}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className={`tabular-nums text-lg font-bold ${alert ? "text-amber-ink" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function LabeledInput({
  label,
  defaultValue,
  onBlurCommit,
}: {
  label: string;
  defaultValue: string;
  onBlurCommit: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink-soft">{label}</label>
      <input
        defaultValue={defaultValue}
        onBlur={(e) => onBlurCommit(e.target.value)}
        className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
      />
    </div>
  );
}
