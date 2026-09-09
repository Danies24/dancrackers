import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/admin/orders (§19.3, §22.2). Filter by status/city/captain/date, search, sort, paginate. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statuses = searchParams.getAll("status");
  const city = searchParams.get("city");
  const captainCode = searchParams.get("captain");
  const needsReview = searchParams.get("needs_review");
  const search = searchParams.get("search")?.trim();
  const sort = searchParams.get("sort") ?? "newest";
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = Number(searchParams.get("offset") ?? 0);

  const supabase = createAdminClient();
  let query = supabase.from("orders").select("*", { count: "exact" });

  if (statuses.length > 0) query = query.in("status", statuses);
  if (city) query = query.eq("city", city);
  if (captainCode) query = query.eq("captain_code", captainCode.toUpperCase());
  if (needsReview === "true") query = query.eq("needs_review", true);
  if (search) {
    query = query.or(
      `order_ref.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  if (sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (sort === "value") query = query.order("grand_total", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ orders: data, total: count ?? 0 });
}
