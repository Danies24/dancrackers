import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enquirySchema, normalizePhone } from "@/lib/validation";
import { computeProductPricing, computeTotals, isBelowMinimumOrder, round2 } from "@/lib/pricing";
import { getPricingSettings } from "@/lib/pricing-settings";
import { getMinimumOrderValue } from "@/config/brandConfig";
import { getSettings } from "@/lib/data";
import { checkEnquiryRateLimit, getClientIp } from "@/lib/rate-limit";
import { hashIp } from "@/lib/hash";
import { buildCustomerMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { sendEnquiryNotifications } from "@/lib/notifications";
import { isOrderDeadlineBlocked } from "@/lib/order-deadline";

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

  if (isOrderDeadlineBlocked()) {
    return NextResponse.json(
      {
        error: {
          code: "deadline_passed",
          message:
            "Season bookings are now closed for Diwali 2026. Please contact us directly on WhatsApp or phone.",
        },
      },
      { status: 403 },
    );
  }

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
    .select("id, sku, name_en, name_ta, unit, price, mrp, is_discountable, discount_percent, net_markup_percent, status")
    .in("id", productIds);

  if (productsError) {
    return NextResponse.json(
      { error: { code: "internal_error", message: "Could not process your enquiry." } },
      { status: 500 },
    );
  }

  const pricingSettings = await getPricingSettings();

  interface LineProduct {
    id: string;
    sku: string;
    name_en: string;
    name_ta: string | null;
    unit: string;
    price: number | null;
    mrp: number | null;
    is_discountable: boolean;
    discount_percent: number;
    net_markup_percent: number;
    status: string;
  }

  const byId = new Map<string, LineProduct>(products.map((p) => [p.id, p]));
  // A cart line's productId may instead be a combo pack variety's id (see
  // supabase/migrations/20260918000001_combo_packs.sql) — resolve anything
  // the products lookup missed against that table before giving up on it.
  // Its selling_price/supplier_cost/commission are already the authoritative,
  // trigger-computed numbers, kept here so the pricing step below can use
  // them directly instead of calling computeProductPricing().
  const comboPricingById = new Map<string, { supplierPrice: number; commission: number }>();
  const missingIds = productIds.filter((id) => !byId.has(id));
  if (missingIds.length > 0) {
    const { data: combos } = await supabase
      .from("combo_pack_varieties")
      .select("id, slug, tier_label, selling_price, supplier_cost, commission, combo_pack_id")
      .in("id", missingIds);
    if (combos && combos.length > 0) {
      const packIds = [...new Set(combos.map((c) => c.combo_pack_id))];
      const { data: packs } = await supabase.from("combo_packs").select("id, name, is_active").in("id", packIds);
      const packById = new Map((packs ?? []).map((p) => [p.id, p]));
      for (const c of combos) {
        const pack = packById.get(c.combo_pack_id);
        if (!pack?.is_active) continue;
        byId.set(c.id, {
          id: c.id,
          sku: `COMBO-${c.slug.toUpperCase()}`,
          name_en: `${pack.name} — ${c.tier_label}`,
          name_ta: null,
          unit: "pack",
          price: c.selling_price,
          mrp: null,
          is_discountable: false,
          discount_percent: 0,
          net_markup_percent: 0,
          status: "active",
        });
        comboPricingById.set(c.id, { supplierPrice: c.supplier_cost, commission: c.commission });
      }
    }
  }

  const validLines = input.items
    .map((item) => {
      const product = byId.get(item.productId);
      if (!product || product.status !== "active" || product.price == null) return null;
      const comboPricing = comboPricingById.get(item.productId);
      const pricing = comboPricing
        ? { customerPrice: product.price, supplierPrice: comboPricing.supplierPrice, commission: comboPricing.commission }
        : computeProductPricing({
            mrp: product.mrp,
            isDiscountable: product.is_discountable,
            discountPercent: Number(product.discount_percent),
            netMarkupPercent: Number(product.net_markup_percent),
            supplierDiscountPercent: pricingSettings.supplierDiscountPercent,
          });
      return { item, product, pricing, comboVarietyId: comboPricing ? item.productId : null };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  if (validLines.length === 0) {
    return NextResponse.json(
      { error: { code: "empty_cart", message: "Your cart has no purchasable items. Please add something first." } },
      { status: 400 },
    );
  }

  const settings = await getSettings();
  const servedPincodes = Array.isArray(settings.served_pincodes) ? (settings.served_pincodes as string[]) : [];

  const totals = computeTotals(
    validLines.map((l) => ({
      price: l.pricing.customerPrice!,
      quantity: l.item.quantity,
      isDiscountable: l.product.is_discountable,
      mrp: l.product.mrp,
    })),
  );

  const supplierTotal = round2(
    validLines.reduce((sum, l) => sum + (l.pricing.supplierPrice ?? 0) * l.item.quantity, 0),
  );
  const commissionTotal = round2(totals.grandTotal - supplierTotal);

  const minOrderValue = getMinimumOrderValue();
  if (isBelowMinimumOrder(totals.subtotal, minOrderValue)) {
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

  // The legacy discount_percent/discount_amount columns predate per-product
  // discounts — now they hold the blended, informational effective rate
  // across this order's discountable lines (mrp_total/you_save are the
  // real per-order figures everything else should read).
  const effectiveDiscountPercent =
    totals.mrpTotal > 0 ? round2((totals.youSave / totals.mrpTotal) * 100) : 0;

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
      state: input.customer.state,
      pincode: input.customer.pincode,
      landmark: input.customer.landmark ?? null,
      preferred_call_time: input.customer.preferredCallTime ?? null,
      notes: input.customer.notes ?? null,
      subtotal: totals.subtotal,
      discountable_subtotal: totals.discountableSubtotal,
      net_rate_subtotal: totals.netRateSubtotal,
      discount_percent: effectiveDiscountPercent,
      discount_amount: totals.youSave,
      packaging_charge: totals.packagingCharge,
      delivery_charge: totals.deliveryCharge,
      grand_total: totals.grandTotal,
      total_quantity: totals.totalQuantity,
      mrp_total: totals.mrpTotal,
      you_save: totals.youSave,
      supplier_total: supplierTotal,
      commission_total: commissionTotal,
      pricing_estimated: false,
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

  // ── Insert order_items snapshot (§16.5 step 7, §21.8) — full supplier/
  // commission pricing snapshot, computed once, never re-derived later. ──
  const orderItemsPayload = validLines.map((l) => ({
    order_id: order.id,
    // A combo pack variety has no row in `products` (see the combo_variety_id
    // column added by supabase/migrations/20260918000001_combo_packs.sql) —
    // product_id's FK would reject its id, so it's tracked there instead.
    product_id: l.comboVarietyId ? null : l.product.id,
    combo_variety_id: l.comboVarietyId,
    sku: l.product.sku,
    name_en: l.product.name_en,
    name_ta: l.product.name_ta,
    unit: l.product.unit,
    unit_price: l.pricing.customerPrice!,
    quantity: l.item.quantity,
    line_total: round2(l.pricing.customerPrice! * l.item.quantity),
    is_discountable: l.product.is_discountable,
    unit_mrp: l.product.mrp,
    discount_percent: l.product.is_discountable ? Number(l.product.discount_percent) : null,
    net_markup_percent: l.product.is_discountable ? null : Number(l.product.net_markup_percent),
    unit_supplier_price: l.pricing.supplierPrice,
    line_supplier_total: round2(l.pricing.supplierPrice! * l.item.quantity),
    line_commission: round2(l.pricing.commission! * l.item.quantity),
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
          subtotal: totals.subtotal,
          packagingCharge: totals.packagingCharge,
          deliveryCharge: totals.deliveryCharge,
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
        mrpTotal: totals.mrpTotal,
        youSave: totals.youSave,
        packagingCharge: totals.packagingCharge,
        deliveryCharge: totals.deliveryCharge,
        grandTotal: totals.grandTotal,
        totalQuantity: totals.totalQuantity,
      },
      whatsappUrl,
    },
    { status: 201 },
  );
}
