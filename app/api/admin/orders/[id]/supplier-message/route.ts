import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSupplierMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { getSettings } from "@/lib/data";
import { getPhoneDisplay, getPrimarySupplier } from "@/config/brandConfig";

/**
 * GET /api/admin/orders/[id]/supplier-message. The formatted order-to-
 * supplier text — what Kolagalam actually pays Sree Sai Ram, never the
 * customer's price. Uses each line's unit_supplier_price/line_supplier_total
 * and the order's supplier_total, not unit_price/line_total/grand_total.
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

  const settings = await getSettings();
  const supplierNumber = String(settings.supplier_whatsapp_number ?? "");

  const orderItems = items ?? [];
  const supplierTotal = Number(order.supplier_total ?? order.grand_total);

  const message = buildSupplierMessage({
    supplierName: getPrimarySupplier().name,
    orderRef: order.order_ref,
    dateDisplay: new Date(order.created_at).toLocaleDateString("en-GB").replace(/\//g, "-"),
    bookedByPhone: getPhoneDisplay(),
    customerName: order.name,
    customerPhone: order.phone,
    address: order.address,
    landmark: order.landmark ?? undefined,
    city: order.city,
    pincode: order.pincode,
    items: orderItems.map((i) => ({
      sku: i.sku,
      nameEn: i.name_en,
      unit: i.unit,
      quantity: i.quantity,
      rate: Number(i.unit_supplier_price ?? i.unit_price),
      amount: Number(i.line_supplier_total ?? i.line_total),
    })),
    subtotal: supplierTotal,
    discountPercent: 0,
    discountAmount: 0,
    grandTotal: supplierTotal,
  });

  const whatsappUrl = supplierNumber ? buildWhatsAppUrl(supplierNumber, message) : null;

  return NextResponse.json({
    message,
    whatsappUrl,
    pricingEstimated: order.pricing_estimated ?? false,
  });
}
