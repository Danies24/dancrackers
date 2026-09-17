import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const patchSchema = z.object({
  quantity: z.number().int().min(1),
});

/** PATCH .../items/[itemId] — quantity only. The AFTER UPDATE trigger recomputes the variety immediately. */
export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Invalid request", fields: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data: item, error } = await supabase
    .from("combo_pack_items")
    .update({ quantity: parsed.data.quantity })
    .eq("id", itemId)
    .select("*, products(id, sku, name_en, name_ta, price, unit)")
    .single();

  if (error || !item) {
    return NextResponse.json({ error: { code: "internal_error", message: error?.message ?? "Could not update item." } }, { status: 500 });
  }

  const { data: variety } = await supabase.from("combo_pack_varieties").select("*").eq("id", item.variety_id).single();
  return NextResponse.json({ item, variety });
}

/** DELETE .../items/[itemId] — the AFTER DELETE trigger recomputes the variety immediately. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const supabase = createAdminClient();

  const { data: existing } = await supabase.from("combo_pack_items").select("variety_id").eq("id", itemId).maybeSingle();
  const { error } = await supabase.from("combo_pack_items").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });

  const variety = existing
    ? (await supabase.from("combo_pack_varieties").select("*").eq("id", existing.variety_id).single()).data
    : null;
  return NextResponse.json({ ok: true, variety });
}
