import { createAdminClient } from "@/lib/supabase/admin";
import { OrderCard } from "@/components/admin/order-card";
import { OrdersFilterBar } from "@/components/admin/orders-filter-bar";

export const dynamic = "force-dynamic";

const ALL_STATUSES = [
  "NEW",
  "CONTACTED",
  "UNREACHABLE",
  "CONFIRMED",
  "PAID",
  "DESPATCHED",
  "DELIVERED",
  "LOST",
  "SPAM",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const statusParam = params.status;
  const statuses = Array.isArray(statusParam) ? statusParam : statusParam ? [statusParam] : [];
  const search = typeof params.search === "string" ? params.search : "";
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const city = typeof params.city === "string" ? params.city : "";
  const captain = typeof params.captain === "string" ? params.captain : "";

  const supabase = createAdminClient();
  let query = supabase.from("orders").select("*", { count: "exact" });
  if (statuses.length > 0) query = query.in("status", statuses);
  if (city) query = query.eq("city", city);
  if (captain) query = query.eq("captain_code", captain.toUpperCase());
  if (search) query = query.or(`order_ref.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`);
  if (sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (sort === "value") query = query.order("grand_total", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const [{ data: orders, count }, { data: cityRows }, { data: captainRows }] = await Promise.all([
    query.limit(100),
    supabase.from("orders").select("city").not("city", "is", null),
    supabase.from("orders").select("captain_code").not("captain_code", "is", null),
  ]);

  const cities = [...new Set((cityRows ?? []).map((r) => r.city))].sort();
  const captains = [...new Set((captainRows ?? []).map((r) => r.captain_code as string))].sort();

  const exportParams = new URLSearchParams();
  statuses.forEach((s) => exportParams.append("status", s));
  if (city) exportParams.set("city", city);
  if (captain) exportParams.set("captain", captain);
  if (search) exportParams.set("search", search);
  if (sort) exportParams.set("sort", sort);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink">
          Orders <span className="text-base font-normal text-muted">({count ?? 0})</span>
        </h1>
        <a
          href={`/api/admin/orders/export?${exportParams.toString()}`}
          className="rounded-md border border-maroon px-3 py-1.5 text-xs font-semibold text-maroon-ink"
        >
          Export CSV
        </a>
      </div>

      <OrdersFilterBar
        allStatuses={ALL_STATUSES}
        activeStatuses={statuses}
        search={search}
        sort={sort}
        allCities={cities}
        activeCity={city}
        allCaptains={captains}
        activeCaptain={captain}
      />

      <div className="mt-4 flex flex-col gap-2">
        {(orders ?? []).length === 0 && <p className="text-sm text-muted">No orders match these filters.</p>}
        {(orders ?? []).map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    </div>
  );
}
