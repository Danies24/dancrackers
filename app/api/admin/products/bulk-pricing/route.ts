import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesUpdate } from "@/types/database";

const bodySchema = z
  .object({
    productIds: z.array(z.string().uuid()).min(1).max(500),
    discountPercent: z.number().min(0).max(100).optional(),
    netMarkupPercent: z.number().min(0).max(100).optional(),
  })
  .refine((v) => v.discountPercent != null || v.netMarkupPercent != null, {
    message: "Provide discountPercent and/or netMarkupPercent.",
  });

/**
 * POST /api/admin/products/bulk-pricing. Applies a discount % and/or net
 * markup % to many products at once (the admin table's "Set discount %" /
 * "Set net markup %" bulk actions) — one round trip instead of one PATCH
 * per row. The products_compute_price trigger recomputes each row's
 * customer price as part of this same update.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Invalid request", fields: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  const { productIds, discountPercent, netMarkupPercent } = parsed.data;
  const fields: TablesUpdate<"products"> = {};
  if (discountPercent != null) fields.discount_percent = discountPercent;
  if (netMarkupPercent != null) fields.net_markup_percent = netMarkupPercent;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .update(fields)
    .in("id", productIds)
    .select("id, price, discount_percent, net_markup_percent");

  if (error) {
    return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ products: data, updated: data?.length ?? 0 });
}
