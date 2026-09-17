import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const patchSchema = z.object({
  tier_label: z.string().trim().min(1).max(40).optional(),
  display_order: z.number().int().optional(),
});

/**
 * PATCH /api/admin/combo-packs/[id]/varieties/[varietyId] — tier_label/display_order
 * only. selling_price/supplier_cost/commission/commission_pct/total_items are
 * intentionally absent from this schema — trigger-maintained, never accepted
 * as input (§5.3 MUST NOT).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; varietyId: string }> }) {
  const { varietyId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Invalid request", fields: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data: updated, error } = await supabase
    .from("combo_pack_varieties")
    .update(parsed.data)
    .eq("id", varietyId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ variety: updated });
}

/** DELETE .../varieties/[varietyId] — cascades to its items. Irreversible for this record (past orders keep their own snapshot). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; varietyId: string }> }) {
  const { varietyId } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("combo_pack_varieties").delete().eq("id", varietyId);
  if (error) return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ ok: true });
}
