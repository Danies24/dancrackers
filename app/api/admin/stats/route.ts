import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/admin/stats (§19.2, §22.2). The KPI strip on the Today view. */
export async function GET() {
  const supabase = createAdminClient();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

  const [todayOrders, confirmedToday, deliveredThisWeek, newOrders] = await Promise.all([
    supabase.from("orders").select("id, grand_total").gte("created_at", startOfToday),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "CONFIRMED").gte("confirmed_at", startOfToday),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "DELIVERED").gte("delivered_at", startOfWeek),
    supabase.from("orders").select("id, created_at").eq("status", "NEW").order("created_at", { ascending: true }),
  ]);

  const enquiriesToday = todayOrders.data?.length ?? 0;
  const valueToday = (todayOrders.data ?? []).reduce((sum, o) => sum + Number(o.grand_total), 0);
  const oldestNew = newOrders.data?.[0];
  const oldestNewAgeHours = oldestNew
    ? (now.getTime() - new Date(oldestNew.created_at).getTime()) / (1000 * 60 * 60)
    : 0;
  const slaBreachCount = (newOrders.data ?? []).filter((o) => o.created_at < twoHoursAgo).length;

  return NextResponse.json({
    enquiriesToday,
    valueToday,
    awaitingFirstCall: newOrders.data?.length ?? 0,
    oldestNewAgeHours,
    slaBreachCount,
    confirmedToday: confirmedToday.count ?? 0,
    deliveredThisWeek: deliveredThisWeek.count ?? 0,
  });
}
