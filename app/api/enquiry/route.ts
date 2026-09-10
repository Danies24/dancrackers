import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enquirySchema, normalizePhone } from "@/lib/validation";
import { computeTotals, isBelowMinimumOrder } from "@/lib/pricing";
import { getSettings } from "@/lib/data";
import { checkEnquiryRateLimit, getClientIp } from "@/lib/rate-limit";
import { hashIp } from "@/lib/hash";
import { buildCustomerMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { sendEnquiryNotifications } from "@/lib/notifications";

const MIN_SUBMIT_SECONDS = 3;

function itemsSignature(items: Array<{ productId: string; quantity: number }>): string {
  return [...items]
    .sort((a, b) => a.productId.localeCompare(b.productId))
    .map((i) => `${i.productId}:${i.quantity}`)
    .join("|");
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = enquirySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Please check the form and try again.", fields: parsed.error.flatten() } },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // Honeypot + minimum time-to-submit (§30.2). Silent drop — respond as if
  // nothing were wrong, without ever creating an order, so a bot never
  // learns it was caught.
  const tooFast =
    typeof input.meta?.formRenderedAt === "number" &&
    Date.now() - input.meta.formRenderedAt < MIN_SUBMIT_SECONDS * 1000;
  if (input.hp_check || tooFast) {
    console.warn("[enquiry] honeypot/speed check tripped — silently dropped");
    return NextResponse.json(
      { orderRef: "DC-0000-0000", totals: null, whatsappUrl: null },
      { status: 201 },
    );
  }

  const ip = getClientIp(request);
  const { allowed } = await checkEnquiryRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many attempts. Please try again later." } },
      { status: 429 },
    );
  }

  const supabase = createAdminClient();
  const phone = input.customer.phone; // already normalized by phoneSchema

  // ── Idempotency: same phone + same cart within 10 minutes → return the original ref ──
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, order_ref, grand_total")
    .eq("phone", phone)
    .gte("created_at", tenMinutesAgo)
    .order("created_at", { ascending: false })
    .limit(5);

  if (recentOrders && recentOrders.length > 0) {
    const requestedSignature = itemsSignature(input.items);
    for (const candidate of recentOrders) {
      const { data: existingItems } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", candidate.id);
      const candidateSignature = itemsSignature(
        (existingItems ?? [])
          .filter((i) => i.product_id)
          .map((i) => ({ productId: i.product_id as string, quantity: i.quantity })),
      );
      if (candidateSignature === requestedSignature) {
        return NextResponse.json(
          {
            orderRef: candidate.order_ref,
            totals: { grandTotal: candidate.grand_total },
            whatsappUrl: null,
            duplicate: true,
          },
          { status: 409 },
        );
      }
    }
  }

  // ── Step 4: re-fetch current prices server-side. Client-supplied prices are ignored entirely. ──
  const productIds = input.items.map((i) => i.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, sku, name_en, name_ta, unit, price, is_discountable, status")
    .in("id", productIds);

  if (productsError) {
    return NextResponse.json(
      { error: { code: "internal_error", message: "Could not process your enquiry." } },
      { status: 500 },
    );
  }

  const byId = new Map(products.map((p) => [p.id, p]));
  const validLines = input.items
    .map((item) => {
      const product = byId.get(item.productId);
      if (!product || product.status !== "active" || product.price == null) return null;
      return { item, product: { ...product, price: product.price } };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  if (validLines.length === 0) {
    return NextResponse.json(
      { error: { code: "empty_cart", message: "Your cart has no purchasable items. Please add something first." } },
      { status: 400 },
    );
  }

  const settings = await getSettings();
  const discountPercent = Number(settings.discount_percent ?? 0);
  const minOrderValue = Number(settings.min_order_value ?? 0);
  const servedPincodes = Array.isArray(settings.served_pincodes) ? (settings.served_pincodes as string[]) : [];

  const totals = computeTotals(
    validLines.map((l) => ({
      price: l.product.price!,
      quantity: l.item.quantity,
      isDiscountable: l.product.is_discountable,
    })),
    discountPercent,
  );

  if (isBelowMinimumOrder(totals.grandTotal, minOrderValue)) {
    return NextResponse.json(
      {
        error: {
          code: "below_minimum_order",
          message: `Minimum order value is ₹${minOrderValue}.`,
        },
      },
      { status: 400 },
    );
  }

  // ── Captain lookup — unknown/inactive code is silently treated as no code (§20.4, FR-4.6) ──
  let captainId: string | null = null;
  let captainCode: string | null = null;
  if (input.captainCode) {
    const { data: captain } = await supabase
      .from("captains")
      .select("id, code")
      .eq("code", input.captainCode)
      .eq("status", "active")
      .maybeSingle();
    if (captain) {
      captainId = captain.id;
      captainCode = captain.code;
    }
  }

  const needsReview = servedPincodes.length > 0 && !servedPincodes.includes(input.customer.pincode);

  // ── Upsert customer on phone (§16.5 step 5) ──
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id, total_orders, total_value")
    .eq("phone", phone)
    .maybeSingle();

  let customerId: string;
  if (existingCustomer) {
    customerId = existingCustomer.id;
    await supabase
      .from("customers")
      .update({
        name: input.customer.name,
        whatsapp: input.customer.whatsapp ?? null,
        email: input.customer.email || null,
        address: input.customer.address,
        city: input.customer.city,
        pincode: input.customer.pincode,
        landmark: input.customer.landmark ?? null,
        total_orders: existingCustomer.total_orders + 1,
        total_value: Number(existingCustomer.total_value) + totals.grandTotal,
        last_order_at: new Date().toISOString(),
      })
      .eq("id", customerId);
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({
        phone,
        name: input.customer.name,
        whatsapp: input.customer.whatsapp ?? null,
        email: input.customer.email || null,
        address: input.customer.address,
        city: input.customer.city,
        pincode: input.customer.pincode,
        landmark: input.customer.landmark ?? null,
        total_orders: 1,
        total_value: totals.grandTotal,
        first_order_at: new Date().toISOString(),
        last_order_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (customerError || !newCustomer) {
      return NextResponse.json(
        { error: { code: "internal_error", message: "We could not save your enquiry." } },
        { status: 500 },
      );
    }
    customerId = newCustomer.id;
  }

  // ── Insert order (§16.5 step 6) ──
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      captain_id: captainId,
      captain_code: captainCode,
      name: input.customer.name,
      phone,
      whatsapp: input.customer.whatsapp ?? null,
      email: input.customer.email || null,
      address: input.customer.address,
      city: input.customer.city,
      pincode: input.customer.pincode,
      landmark: input.customer.landmark ?? null,
      preferred_call_time: input.customer.preferredCallTime ?? null,
      notes: input.customer.notes ?? null,
      subtotal: totals.subtotal,
      discountable_subtotal: totals.discountableSubtotal,
      net_rate_subtotal: totals.netRateSubtotal,
      discount_percent: discountPercent,
      discount_amount: totals.discountAmount,
      grand_total: totals.grandTotal,
      total_quantity: totals.totalQuantity,
      status: "NEW",
      needs_review: needsReview,
      source_url: input.meta?.sourceUrl ?? null,
      user_agent: request.headers.get("user-agent"),
      ip_hash: hashIp(ip),
    })
    .select("id, order_ref")
    .single();

  if (orderError || !order) {
    console.error("[enquiry] order insert failed", orderError);
    return NextResponse.json(
      { error: { code: "internal_error", message: "We could not save your enquiry." } },
      { status: 500 },
    );
  }

  // ── Insert order_items snapshot (§16.5 step 7, §21.8) ──
  const orderItemsPayload = validLines.map((l) => ({
    order_id: order.id,
    product_id: l.product.id,
    sku: l.product.sku,
    name_en: l.product.name_en,
    name_ta: l.product.name_ta,
    unit: l.product.unit,
    unit_price: l.product.price,
    quantity: l.item.quantity,
    line_total: Math.round(l.product.price! * l.item.quantity * 100) / 100,
    is_discountable: l.product.is_discountable,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload);
  if (itemsError) {
    console.error("[enquiry] order_items insert failed, rolling back order", itemsError);
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json(
      { error: { code: "internal_error", message: "We could not save your enquiry." } },
      { status: 500 },
    );
  }

  // ── Notifications (§16.5 step 9, §18) — failures never affect the response ──
  const whatsappBusinessNumber = String(settings.whatsapp_business_number ?? "");
  const whatsappUrl = whatsappBusinessNumber
    ? buildWhatsAppUrl(
        whatsappBusinessNumber,
        buildCustomerMessage({
          orderRef: order.order_ref,
          name: input.customer.name,
          phone,
          items: orderItemsPayload.map((i) => ({
            nameEn: i.name_en,
            quantity: i.quantity,
            unit: i.unit,
            lineTotal: i.line_total,
          })),
          grandTotal: totals.grandTotal,
          address: input.customer.address,
        }),
      )
    : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await sendEnquiryNotifications({
    orderRef: order.order_ref,
    name: input.customer.name,
    phone,
    city: input.customer.city,
    pincode: input.customer.pincode,
    grandTotal: totals.grandTotal,
    captainCode: captainCode ?? undefined,
    notes: input.customer.notes,
    itemLines: orderItemsPayload.map(
      (i, idx) => `${idx + 1}. ${i.name_en} — ${i.quantity} ${i.unit} — ₹${i.line_total}`,
    ),
    adminOrderUrl: `${siteUrl}/admin/orders/${order.id}`,
  }).catch((err) => console.error("[enquiry] notifications failed", err));

  return NextResponse.json(
    {
      orderRef: order.order_ref,
      totals: {
        subtotal: totals.subtotal,
        discountableSubtotal: totals.discountableSubtotal,
        netRateSubtotal: totals.netRateSubtotal,
        discountAmount: totals.discountAmount,
        grandTotal: totals.grandTotal,
        totalQuantity: totals.totalQuantity,
      },
      whatsappUrl,
    },
    { status: 201 },
  );
}
