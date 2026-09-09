import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatRupees, hoursSince } from "@/lib/format";
import { OrderCard } from "@/components/admin/order-card";

export const dynamic = "force-dynamic";

async function getTodayData() {
  const supabase = createAdminClient();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: todayOrders }, { count: confirmedToday }, { count: deliveredThisWeek }, { data: newOrders }] =
    await Promise.all([
      supabase.from("orders").select("id, grand_total").gte("created_at", startOfToday),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "CONFIRMED").gte("confirmed_at", startOfToday),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "DELIVERED").gte("delivered_at", startOfWeek),
      supabase.from("orders").select("*").eq("status", "NEW").order("created_at", { ascending: true }),
    ]);

  return {
    enquiriesToday: todayOrders?.length ?? 0,
    valueToday: (todayOrders ?? []).reduce((s, o) => s + Number(o.grand_total), 0),
    confirmedToday: confirmedToday ?? 0,
    deliveredThisWeek: deliveredThisWeek ?? 0,
    newOrders: newOrders ?? [],
  };
}

export default async function AdminTodayPage() {
  const { enquiriesToday, valueToday, confirmedToday, deliveredThisWeek, newOrders } = await getTodayData();
  const breaching = newOrders.filter((o) => hoursSince(o.created_at) > 2);
  const oldestAge = newOrders.length > 0 ? hoursSince(newOrders[0].created_at) : 0;

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold text-ink">Today</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Enquiries today" value={String(enquiriesToday)} />
        <Kpi label="Value today" value={formatRupees(valueToday)} />
        <Kpi
          label="Awaiting first call"
          value={String(newOrders.length)}
          alert={oldestAge > 2}
          sub={newOrders.length > 0 ? `oldest ${oldestAge.toFixed(1)}h` : undefined}
        />
        <Kpi label="Confirmed today" value={String(confirmedToday)} />
        <Kpi label="Delivered this week" value={String(deliveredThisWeek)} />
      </div>

      {breaching.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-red">SLA breach — over 2 hours, no contact</h2>
          <div className="flex flex-col gap-2">
            {breaching.map((o) => (
              <OrderCard key={o.id} order={o} highlight />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">New enquiries</h2>
          <Link href="/admin/orders" className="text-xs font-semibold text-maroon">
            View all →
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {newOrders.length === 0 && <p className="text-sm text-muted">No new enquiries. 🎉</p>}
          {newOrders
            .filter((o) => !breaching.includes(o))
            .map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, alert, sub }: { label: string; value: string; alert?: boolean; sub?: string }) {
  return (
    <div className={`rounded-lg border p-3 ${alert ? "border-red bg-red/5" : "border-border bg-surface"}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className={`tabular-nums text-lg font-bold ${alert ? "text-red" : "text-ink"}`}>{value}</p>
      {sub && <p className={`text-xs ${alert ? "text-red" : "text-muted"}`}>{sub}</p>}
    </div>
  );
}
