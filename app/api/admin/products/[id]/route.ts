import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdminUser } from "@/lib/admin-auth";

const patchSchema = z.object({
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
  price: z.number().nonnegative().nullable().optional(),
  status: z.enum(["active", "unavailable", "archived"]).optional(),
  is_bestseller: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_discountable: z.boolean().optional(),
  image_url: z.string().url().nullable().optional(),
  reason: z.string().max(200).optional(),
});

/**
 * PATCH /api/admin/products/[id] (§19.5, §22.2, §14.7). Every price change
 * writes a price_history row — this is the audit trail a supplier dispute
 * gets settled against.
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

  if (fields.price !== undefined && fields.price !== existing.price) {
    await supabase.from("price_history").insert({
      product_id: id,
      old_price: existing.price,
      new_price: fields.price,
      changed_by: admin?.email ?? "admin",
      reason: reason ?? null,
    });
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

  return NextResponse.json({ product: updated });
}
