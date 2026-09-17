import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCustomerUpdateMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * GET /api/admin/orders/[id]/customer-update-message. Order no., items,
 * customer total, and dispatch tracking — the customer-facing counterpart
 * to the supplier message. Never includes supplier rate, supplier total or
 * commission.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id).order("sku"),
  ]);

  if (!order) {
    return NextResponse.json({ error: { code: "not_found", message: "Order not found." } }, { status: 404 });
  }

  const message = buildCustomerUpdateMessage({
    orderRef: order.order_ref,
    items: (items ?? []).map((i) => ({
      nameEn: i.name_en,
      quantity: i.quantity,
      unit: i.unit,
      lineTotal: Number(i.line_total),
    })),
    grandTotal: Number(order.grand_total),
    lrNumber: order.lr_number,
    transportName: order.transport_name,
    trackingUrl: order.tracking_url,
  });

  const whatsappUrl = order.whatsapp || order.phone ? buildWhatsAppUrl(order.whatsapp || order.phone, message) : null;

  return NextResponse.json({ message, whatsappUrl });
}
