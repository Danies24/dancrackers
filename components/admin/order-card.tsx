import Link from "next/link";
import { formatIST, formatRupees, hoursSince } from "@/lib/format";
import type { Database } from "@/types/database";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const statusColors: Record<string, string> = {
  NEW: "bg-maroon-tint text-maroon-ink",
  CONTACTED: "bg-gold-tint text-gold",
  UNREACHABLE: "bg-amber/10 text-amber",
  CONFIRMED: "bg-teal-tint text-teal",
  PAID: "bg-teal-tint text-teal",
  DESPATCHED: "bg-teal-tint text-teal",
  DELIVERED: "bg-teal text-white",
  LOST: "bg-black/10 text-ink-soft",
  SPAM: "bg-black/10 text-ink-soft",
};

/** §19.2, §19.3. Card: reference · name · city · total · captain · age · [Call] [WhatsApp] [Open]. */
export function OrderCard({ order, highlight }: { order: Order; highlight?: boolean }) {
  const age = hoursSince(order.created_at);

  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-red bg-red/5" : "border-border bg-surface"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm font-semibold text-maroon-ink">
            {order.order_ref}
          </Link>
          <p className="text-sm font-medium text-ink">{order.name}</p>
          <p className="text-xs text-muted">
            {order.city} · {formatIST(order.created_at)}
            {order.captain_code && <> · via {order.captain_code}</>}
            {order.needs_review && <span className="ml-1 text-amber">· needs review</span>}
          </p>
        </div>
        <div className="text-right">
          <p className="tabular-nums text-sm font-bold text-ink">{formatRupees(Number(order.grand_total))}</p>
          <span className={`inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${statusColors[order.status] ?? ""}`}>
            {order.status}
          </span>
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <a
          href={`tel:+91${order.phone}`}
          className="flex-1 rounded-md border border-maroon py-1.5 text-center text-xs font-semibold text-maroon-ink"
        >
          Call
        </a>
        <a
          href={`https://wa.me/91${order.phone}`}
          target="_blank"
          rel="noopener"
          className="flex-1 rounded-md bg-whatsapp py-1.5 text-center text-xs font-semibold text-white"
        >
          WhatsApp
        </a>
        <Link
          href={`/admin/orders/${order.id}`}
          className="flex-1 rounded-md bg-secondary-bg py-1.5 text-center text-xs font-semibold text-ink"
        >
          Open
        </Link>
      </div>
      {highlight && <p className="mt-1 text-xs font-semibold text-red">{age.toFixed(1)}h since submitted</p>}
    </div>
  );
}
