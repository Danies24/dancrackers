import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrderDetailClient } from "@/components/admin/order-detail-client";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id).order("sku"),
  ]);

  if (!order) notFound();

  return <OrderDetailClient initialOrder={order} items={items ?? []} />;
}
