import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const createSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1),
});

/**
 * POST .../items — add a catalogue product to this variety's basket.
 * Always a real product_id (§5.3 MUST NOT allow a free-text item) — the FK
 * on combo_pack_items.product_id enforces this at the DB level regardless.
 * selling_price etc. are never touched here; the AFTER INSERT trigger on
 * combo_pack_items recomputes the variety immediately.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string; varietyId: string }> }) {
  const { varietyId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Invalid request", fields: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, mrp, price")
    .eq("id", parsed.data.product_id)
    .maybeSingle();
  if (!product) {
    return NextResponse.json({ error: { code: "not_found", message: "That product doesn't exist." } }, { status: 404 });
  }
  // §5.3 CC-8: never silently compute a ₹0/wrong commission for an item
  // with no cost basis — refuse the add and say why, rather than letting
  // the trigger quietly treat a null mrp as ₹0.
  if (product.mrp == null) {
    return NextResponse.json(
      {
        error: {
          code: "missing_cost_basis",
          message: "This product has no MRP set, so its supplier cost can't be computed. Set its MRP on /admin/products first.",
        },
      },
      { status: 400 },
    );
  }

  const { count } = await supabase
    .from("combo_pack_items")
    .select("*", { count: "exact", head: true })
    .eq("variety_id", varietyId);

  const { data: item, error } = await supabase
    .from("combo_pack_items")
    .insert({
      variety_id: varietyId,
      product_id: parsed.data.product_id,
      quantity: parsed.data.quantity,
      display_order: (count ?? 0) + 1,
    })
    .select("*, products(id, sku, name_en, name_ta, price, unit)")
    .single();

  if (error || !item) {
    const isDuplicate = error?.code === "23505";
    return NextResponse.json(
      {
        error: {
          code: isDuplicate ? "already_added" : "internal_error",
          message: isDuplicate ? "That product is already in this variety — edit its quantity instead." : (error?.message ?? "Could not add item."),
        },
      },
      { status: isDuplicate ? 409 : 500 },
    );
  }

  const { data: variety } = await supabase.from("combo_pack_varieties").select("*").eq("id", varietyId).single();

  return NextResponse.json({ item, variety }, { status: 201 });
}
