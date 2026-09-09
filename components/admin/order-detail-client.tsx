"use client";

import { useState } from "react";
import { formatIST, formatRupees } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import type { Database } from "@/types/database";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

const STATUS_FLOW = [
  "NEW",
  "CONTACTED",
  "UNREACHABLE",
  "CONFIRMED",
  "PAID",
  "DESPATCHED",
  "DELIVERED",
  "LOST",
  "SPAM",
] as const;

const LOST_REASONS = ["price", "timing", "already bought", "no delivery to area", "unreachable", "other"];

export function OrderDetailClient({ initialOrder, items }: { initialOrder: Order; items: OrderItem[] }) {
  const { show } = useToast();
  const [order, setOrder] = useState(initialOrder);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [supplierMessage, setSupplierMessage] = useState<{ message: string; whatsappUrl: string | null } | null>(null);
  const [pendingLostReason, setPendingLostReason] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        show(data?.error?.message ?? "Could not save changes.");
        return;
      }
      setOrder(data.order);
      show("Saved.");
    } finally {
      setSaving(false);
    }
  }

  function handleStatusChange(status: string) {
    if (status === "LOST") {
      setPendingLostReason(true);
      return;
    }
    patch({ status });
  }

  async function fetchSupplierMessage() {
    const res = await fetch(`/api/admin/orders/${order.id}/supplier-message`);
    const data = await res.json();
    setSupplierMessage(data);
  }

  async function copySupplierMessage() {
    if (!supplierMessage) await fetchSupplierMessage();
    const text = supplierMessage?.message;
    if (text) {
      navigator.clipboard?.writeText(text);
      show("Supplier message copied.");
    }
  }

  const notes = Array.isArray(order.internal_notes) ? (order.internal_notes as Array<{ at: string; by: string; text: string }>) : [];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-mono text-lg font-semibold text-ink">{order.order_ref}</h1>
        <p className="text-xs text-muted">{formatIST(order.created_at)}</p>
      </div>

      {/* Customer block */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">Customer</h2>
        <p className="text-sm font-medium">{order.name}</p>
        <p className="text-sm text-ink-soft">
          <a href={`tel:+91${order.phone}`} className="font-semibold text-maroon">
            {order.phone}
          </a>{" "}
          ·{" "}
          <a href={`https://wa.me/91${order.phone}`} target="_blank" rel="noopener" className="font-semibold text-whatsapp">
            WhatsApp
          </a>
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {order.address}
          {order.landmark && <>, near {order.landmark}</>}
          <br />
          {order.city} {order.pincode}
        </p>
        {order.preferred_call_time && <p className="mt-1 text-xs text-muted">Preferred call time: {order.preferred_call_time}</p>}
        {order.needs_review && <p className="mt-1 text-xs font-semibold text-amber">⚠ Needs review (out-of-area pincode)</p>}
        {order.captain_code && <p className="mt-1 text-xs text-ink-soft">Captain: <strong>{order.captain_code}</strong></p>}
      </section>

      {/* Items */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="pb-1">SKU</th>
                <th className="pb-1">Item</th>
                <th className="pb-1 text-right">Qty</th>
                <th className="pb-1 text-right">Rate</th>
                <th className="pb-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-1 font-mono text-xs">{item.sku}</td>
                  <td className="py-1">{item.name_en}</td>
                  <td className="py-1 text-right tabular-nums">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-1 text-right tabular-nums">{formatRupees(Number(item.unit_price))}</td>
                  <td className="py-1 text-right tabular-nums">{formatRupees(Number(item.line_total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 space-y-0.5 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatRupees(Number(order.subtotal))}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-ink-soft">
              <span>Discount ({order.discount_percent}%)</span>
              <span className="tabular-nums">-{formatRupees(Number(order.discount_amount))}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-1 font-bold text-ink">
            <span>Total</span>
            <span className="tabular-nums">{formatRupees(Number(order.grand_total))}</span>
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">Status</h2>
        <select
          value={order.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={saving}
          className="h-10 w-full rounded-md border border-border bg-surface px-2 text-sm"
        >
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {order.lost_reason && <p className="mt-1 text-xs text-muted">Lost reason: {order.lost_reason}</p>}

        {pendingLostReason && (
          <div className="mt-3 rounded-md border border-red/30 bg-red/5 p-3">
            <p className="mb-2 text-sm font-medium text-ink">Why was this order lost?</p>
            <div className="flex flex-wrap gap-1.5">
              {LOST_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    patch({ status: "LOST", lostReason: reason });
                    setPendingLostReason(false);
                  }}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-xs"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button onClick={() => setPendingLostReason(false)} className="mt-2 text-xs text-muted underline">
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* Supplier message */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">Supplier order</h2>
        <div className="flex gap-2">
          <button onClick={copySupplierMessage} className="flex-1 rounded-md border border-maroon py-2 text-sm font-semibold text-maroon">
            Copy supplier message
          </button>
          {supplierMessage?.whatsappUrl && (
            <a
              href={supplierMessage.whatsappUrl}
              target="_blank"
              rel="noopener"
              className="flex-1 rounded-md bg-whatsapp py-2 text-center text-sm font-semibold text-white"
            >
              Send on WhatsApp
            </a>
          )}
        </div>
        {supplierMessage?.message && (
          <pre className="mt-3 whitespace-pre-wrap rounded-md bg-cream p-3 font-mono text-xs">{supplierMessage.message}</pre>
        )}
      </section>

      {/* Notes */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">Internal notes</h2>
        <div className="mb-3 flex flex-col gap-2">
          {notes.length === 0 && <p className="text-xs text-muted">No notes yet.</p>}
          {notes.map((n, i) => (
            <div key={i} className="rounded-md bg-cream p-2 text-sm">
              <p>{n.text}</p>
              <p className="mt-1 text-xs text-muted">
                {n.by} · {formatIST(n.at)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note…"
            className="h-16 flex-1 rounded-md border border-border p-2 text-sm"
          />
          <button
            onClick={() => {
              if (!note.trim()) return;
              patch({ note });
              setNote("");
            }}
            disabled={saving || !note.trim()}
            className="rounded-md bg-secondary-bg px-4 text-sm font-semibold text-ink disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </section>
    </div>
  );
}
