import { NextResponse, type NextRequest } from "next/server";
import Papa from "papaparse";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatIST } from "@/lib/format";

/** GET /api/admin/orders/export — same filters as the admin orders list, as a CSV download. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statuses = searchParams.getAll("status");
  const city = searchParams.get("city");
  const captainCode = searchParams.get("captain");
  const search = searchParams.get("search")?.trim();
  const sort = searchParams.get("sort") ?? "newest";

  const supabase = createAdminClient();
  let query = supabase.from("orders").select("*");

  if (statuses.length > 0) query = query.in("status", statuses);
  if (city) query = query.eq("city", city);
  if (captainCode) query = query.eq("captain_code", captainCode.toUpperCase());
  if (search) {
    query = query.or(`order_ref.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  if (sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (sort === "value") query = query.order("grand_total", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data: orders, error } = await query.limit(5000);
  if (error) {
    return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });
  }

  const rows = (orders ?? []).map((o) => ({
    order_ref: o.order_ref,
    created_at: formatIST(o.created_at),
    status: o.status,
    name: o.name,
    phone: o.phone,
    city: o.city,
    pincode: o.pincode,
    address: o.address,
    landmark: o.landmark ?? "",
    captain_code: o.captain_code ?? "",
    subtotal: o.subtotal,
    discount_percent: o.discount_percent,
    discount_amount: o.discount_amount,
    grand_total: o.grand_total,
    total_quantity: o.total_quantity,
    commission_rate: o.commission_rate ?? "",
    commission_amount: o.commission_amount ?? "",
    commission_paid_at: o.commission_paid_at ? formatIST(o.commission_paid_at) : "",
    needs_review: o.needs_review,
    lost_reason: o.lost_reason ?? "",
  }));

  const csv = Papa.unparse(rows);
  const filename = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
