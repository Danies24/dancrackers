import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDigestEmail, type DigestOrder } from "@/lib/notifications";
import { hoursSince } from "@/lib/format";

/**
 * GET /api/cron/digest (§18.6). Called by Vercel Cron at 09:00 and 18:00
 * IST (see vercel.json). Authenticated with CRON_SECRET as a bearer token
 * so it can't be triggered by an outsider.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: { code: "unauthorized" } }, { status: 401 });
  }

  const supabase = createAdminClient();

  const [{ data: newOrders }, { data: confirmedOrders }] = await Promise.all([
    supabase.from("orders").select("order_ref, name, city, grand_total, created_at, status").eq("status", "NEW"),
    supabase.from("orders").select("order_ref, name, city, grand_total, created_at").eq("status", "CONFIRMED"),
  ]);

  const toDigestOrder = (o: { order_ref: string; name: string; city: string; grand_total: number; created_at: string }): DigestOrder => ({
    orderRef: o.order_ref,
    name: o.name,
    city: o.city,
    grandTotal: Number(o.grand_total),
    ageHours: hoursSince(o.created_at),
  });

  const allNew = (newOrders ?? []).map(toDigestOrder);
  const slaBreaches = allNew.filter((o) => o.ageHours > 2);
  const newSinceLastDigest = allNew.filter((o) => o.ageHours <= 12); // approximates "since last digest" without a separate cursor table
  const confirmedAwaitingPayment = (confirmedOrders ?? []).map(toDigestOrder);

  await sendDigestEmail({ newSinceLastDigest, slaBreaches, confirmedAwaitingPayment });

  return NextResponse.json({
    sent: true,
    newCount: newSinceLastDigest.length,
    slaBreachCount: slaBreaches.length,
    confirmedCount: confirmedAwaitingPayment.length,
  });
}
