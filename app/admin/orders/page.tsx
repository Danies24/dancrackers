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

  const supabase = createAdminClient();
  let query = supabase.from("orders").select("*", { count: "exact" });
  if (statuses.length > 0) query = query.in("status", statuses);
  if (search) query = query.or(`order_ref.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`);
  if (sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (sort === "value") query = query.order("grand_total", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data: orders, count } = await query.limit(100);

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold text-ink">
        Orders <span className="text-base font-normal text-muted">({count ?? 0})</span>
      </h1>

      <OrdersFilterBar allStatuses={ALL_STATUSES} activeStatuses={statuses} search={search} sort={sort} />

      <div className="mt-4 flex flex-col gap-2">
        {(orders ?? []).length === 0 && <p className="text-sm text-muted">No orders match these filters.</p>}
        {(orders ?? []).map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    </div>
  );
}
