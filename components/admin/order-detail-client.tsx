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
  const [customerUpdateMessage, setCustomerUpdateMessage] = useState<{ message: string; whatsappUrl: string | null } | null>(null);
  const [pendingLostReason, setPendingLostReason] = useState(false);
  const [captainEditing, setCaptainEditing] = useState(false);
  const [captainInput, setCaptainInput] = useState("");
  const [captainNote, setCaptainNote] = useState("");
  const [paidAmount, setPaidAmount] = useState(String(order.supplier_total ?? order.grand_total ?? ""));
  const [paidRef, setPaidRef] = useState("");
  const [lrNumber, setLrNumber] = useState(order.lr_number ?? "");
  const [transportName, setTransportName] = useState(order.transport_name ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? "");

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

  async function fetchCustomerUpdateMessage() {
    const res = await fetch(`/api/admin/orders/${order.id}/customer-update-message`);
    const data = await res.json();
    setCustomerUpdateMessage(data);
  }

  async function copyCustomerUpdateMessage() {
    if (!customerUpdateMessage) await fetchCustomerUpdateMessage();
    const text = customerUpdateMessage?.message;
    if (text) {
      navigator.clipboard?.writeText(text);
      show("Customer update copied.");
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
          <a href={`tel:+91${order.phone}`} className="font-semibold text-maroon-ink">
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
      </section>

      {/* Captain */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">Captain</h2>
        {order.captain_code ? (
          <p className="text-sm text-ink-soft">
            via <strong className="font-mono text-ink">{order.captain_code}</strong>
          </p>
        ) : (
          <p className="text-sm text-muted">Direct — no captain referral</p>
        )}

        {captainEditing ? (
          <div className="mt-2 flex flex-col gap-2">
            <input
              value={captainInput}
              onChange={(e) => setCaptainInput(e.target.value.toUpperCase())}
              placeholder="e.g. RAJ12 (blank to clear)"
              className="h-10 w-full rounded-md border border-border px-2 font-mono text-sm"
            />
            <input
              value={captainNote}
              onChange={(e) => setCaptainNote(e.target.value)}
              placeholder="Reason (optional) — e.g. customer confirmed they used Rajesh's link"
              className="h-10 w-full rounded-md border border-border px-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  patch({ captainCode: captainInput.trim() || null, note: captainNote.trim() || undefined });
                  setCaptainEditing(false);
                  setCaptainNote("");
                }}
                disabled={saving}
                className="rounded-md bg-maroon px-3 py-1.5 text-xs font-semibold text-white"
              >
                Save
              </button>
              <button onClick={() => setCaptainEditing(false)} className="text-xs text-muted underline">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setCaptainInput(order.captain_code ?? "");
              setCaptainEditing(true);
            }}
            className="mt-2 text-xs font-semibold text-maroon-ink underline"
          >
            {order.captain_code ? "Correct attribution" : "Set a captain"}
          </button>
        )}
      </section>

      {/* Items */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Items</h2>
          {order.pricing_estimated && (
            <span className="rounded-full bg-gold-tint px-2 py-0.5 text-[10px] font-semibold text-gold-ink">
              Supplier figures estimated
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="pb-1">SKU</th>
                <th className="pb-1">Item</th>
                <th className="pb-1 text-right">Qty</th>
                <th className="pb-1 text-right">Customer price</th>
                <th className="pb-1 text-right">Customer amount</th>
                <th className="pb-1 text-right">Supplier price</th>
                <th className="pb-1 text-right">Supplier amount</th>
                <th className="pb-1 text-right">Commission</th>
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
                  <td className="py-1 text-right tabular-nums text-muted">
                    {item.unit_supplier_price != null ? formatRupees(Number(item.unit_supplier_price)) : "—"}
                  </td>
                  <td className="py-1 text-right tabular-nums text-muted">
                    {item.line_supplier_total != null ? formatRupees(Number(item.line_supplier_total)) : "—"}
                  </td>
                  <td className="py-1 text-right tabular-nums font-semibold text-teal-ink">
                    {item.line_commission != null ? formatRupees(Number(item.line_commission)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 rounded-md bg-cream p-3 text-sm">
          <p>
            Customer pays <strong className="tabular-nums">{formatRupees(Number(order.grand_total))}</strong> ·{" "}
            <strong className="tabular-nums">You pay Supplier {formatRupees(Number(order.supplier_total ?? 0))}</strong> ·{" "}
            You keep{" "}
            <strong
              className={`tabular-nums ${Number(order.commission_total ?? 0) > 0 ? "text-teal-ink" : "text-red-ink"}`}
            >
              {formatRupees(Number(order.commission_total ?? 0))}
            </strong>
          </p>
          {(Number(order.packaging_charge ?? 0) > 0 || Number(order.delivery_charge ?? 0) > 0) && (
            <p className="mt-1 text-xs text-muted">
              Items {formatRupees(Number(order.subtotal))}
              {Number(order.packaging_charge ?? 0) > 0 && ` + Packaging ${formatRupees(Number(order.packaging_charge))}`}
              {Number(order.delivery_charge ?? 0) > 0 && ` + Delivery ${formatRupees(Number(order.delivery_charge))}`}
            </p>
          )}
        </div>
      </section>

      {/* Supplier payment */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">Supplier payment</h2>
        <p className="mb-3 text-sm text-ink-soft">
          Status:{" "}
          <span
            className={`font-semibold ${order.supplier_payment_status === "paid" ? "text-teal-ink" : "text-amber-ink"}`}
          >
            {order.supplier_payment_status ?? "pending"}
          </span>
          {order.supplier_paid_at && ` · ${formatIST(order.supplier_paid_at)}`}
        </p>
        {order.supplier_payment_status === "paid" ? (
          <button
            onClick={() => patch({ supplierPaymentStatus: "pending" })}
            disabled={saving}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-ink"
          >
            Mark as not yet paid
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="Amount paid"
                className="h-10 rounded-md border border-border px-2 text-sm tabular-nums"
              />
              <input
                value={paidRef}
                onChange={(e) => setPaidRef(e.target.value)}
                placeholder="UPI / bank ref"
                className="h-10 rounded-md border border-border px-2 text-sm"
              />
            </div>
            <button
              onClick={() =>
                patch({
                  supplierPaymentStatus: "paid",
                  supplierPaidAmount: paidAmount ? Number(paidAmount) : undefined,
                  supplierPaymentRef: paidRef || undefined,
                })
              }
              disabled={saving}
              className="rounded-md bg-maroon px-3 py-2 text-sm font-semibold text-white"
            >
              Mark supplier paid
            </button>
          </div>
        )}
      </section>

      {/* LR / tracking */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">Dispatch / tracking</h2>
        {order.dispatched_at && <p className="mb-2 text-xs text-muted">Dispatched {formatIST(order.dispatched_at)}</p>}
        <div className="flex flex-col gap-2">
          <input
            value={lrNumber}
            onChange={(e) => setLrNumber(e.target.value)}
            placeholder="LR number"
            className="h-10 rounded-md border border-border px-2 text-sm"
          />
          <input
            value={transportName}
            onChange={(e) => setTransportName(e.target.value)}
            placeholder="Transport name"
            className="h-10 rounded-md border border-border px-2 text-sm"
          />
          <input
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            placeholder="Tracking link"
            className="h-10 rounded-md border border-border px-2 text-sm"
          />
          <button
            onClick={() => patch({ lrNumber, transportName, trackingUrl })}
            disabled={saving}
            className="rounded-md bg-secondary-bg px-3 py-2 text-sm font-semibold text-ink"
          >
            Save dispatch details
          </button>
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
          <button onClick={copySupplierMessage} className="flex-1 rounded-md border border-maroon py-2 text-sm font-semibold text-maroon-ink">
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

      {/* Customer update */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">Customer update</h2>
        <div className="flex gap-2">
          <button
            onClick={copyCustomerUpdateMessage}
            className="flex-1 rounded-md border border-maroon py-2 text-sm font-semibold text-maroon-ink"
          >
            Copy update for customer
          </button>
          {customerUpdateMessage?.whatsappUrl && (
            <a
              href={customerUpdateMessage.whatsappUrl}
              target="_blank"
              rel="noopener"
              className="flex-1 rounded-md bg-whatsapp py-2 text-center text-sm font-semibold text-white"
            >
              Send on WhatsApp
            </a>
          )}
        </div>
        {customerUpdateMessage?.message && (
          <pre className="mt-3 whitespace-pre-wrap rounded-md bg-cream p-3 font-mono text-xs">
            {customerUpdateMessage.message}
          </pre>
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
