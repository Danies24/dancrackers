import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSupplierMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { getSettings } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";

/** GET /api/admin/orders/[id]/supplier-message (§17.4, §22.2). The formatted order-to-supplier text. */
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

  const settings = await getSettings();
  const supplierNumber = String(settings.supplier_whatsapp_number ?? "");

  const message = buildSupplierMessage({
    supplierName: siteConfig.supplier.name,
    orderRef: order.order_ref,
    dateDisplay: new Date(order.created_at).toLocaleDateString("en-GB").replace(/\//g, "-"),
    bookedByName: "Dan",
    bookedByPhone: siteConfig.operator.phoneDisplay,
    customerName: order.name,
    customerPhone: order.phone,
    address: order.address,
    landmark: order.landmark ?? undefined,
    city: order.city,
    pincode: order.pincode,
    items: (items ?? []).map((i) => ({
      sku: i.sku,
      nameEn: i.name_en,
      unit: i.unit,
      quantity: i.quantity,
      rate: Number(i.unit_price),
      amount: Number(i.line_total),
    })),
    subtotal: Number(order.subtotal),
    discountPercent: Number(order.discount_percent),
    discountAmount: Number(order.discount_amount),
    grandTotal: Number(order.grand_total),
  });

  const whatsappUrl = supplierNumber ? buildWhatsAppUrl(supplierNumber, message) : null;

  return NextResponse.json({ message, whatsappUrl });
}
