import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdminUser } from "@/lib/admin-auth";

// `.strict()` — an unknown field (most importantly `price`, `supplier_price`
// or `commission`) is a validation error, not silently dropped. Customer
// price is always server-derived (the products_compute_price trigger, from
// mrp/is_discountable/discount_percent/net_markup_percent); supplier price
// and commission are never stored at all, only computed at read time — no
// client can ever set any of the three directly.
const patchSchema = z
  .object({
    name_en: z.string().min(1).optional(),
    name_ta: z.string().nullable().optional(),
    sku: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    category_id: z.string().uuid().optional(),
    unit: z.enum(["pkt", "pcs", "box", "bundle"]).optional(),
    min_qty: z.number().int().positive().optional(),
    description: z.string().nullable().optional(),
    display_order: z.number().int().optional(),
    video_url: z.string().url().nullable().optional(),
    mrp: z.number().nonnegative().nullable().optional(),
    discount_percent: z.number().min(0).max(100).optional(),
    net_markup_percent: z.number().min(0).max(100).optional(),
    status: z.enum(["active", "unavailable", "archived"]).optional(),
    is_bestseller: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    is_discountable: z.boolean().optional(),
    image_url: z.string().url().nullable().optional(),
    reason: z.string().max(200).optional(),
  })
  .strict();

/**
 * PATCH /api/admin/products/[id]. Every effective price change (any edit
 * that moves the trigger-computed customer price) writes a price_history
 * row — this is the audit trail a supplier dispute gets settled against.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Invalid request", fields: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  const { reason, ...fields } = parsed.data;
  const supabase = createAdminClient();
  const admin = await getCurrentAdminUser();

  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("price")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: { code: "not_found", message: "Product not found." } }, { status: 404 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("products")
    .update(fields)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: { code: "internal_error", message: updateError.message } }, { status: 500 });
  }

  if (updated.price !== existing.price) {
    await supabase.from("price_history").insert({
      product_id: id,
      old_price: existing.price,
      new_price: updated.price,
      changed_by: admin?.email ?? "admin",
      reason: reason ?? null,
    });
  }

  return NextResponse.json({ product: updated });
}
