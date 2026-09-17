import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/admin/combo-packs/[id] — full detail: pack + varieties + every variety's items (joined to products). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: pack, error } = await supabase.from("combo_packs").select("*").eq("id", id).maybeSingle();
  if (error || !pack) {
    return NextResponse.json({ error: { code: "not_found", message: "Combo pack not found." } }, { status: 404 });
  }

  const { data: varieties } = await supabase
    .from("combo_pack_varieties")
    .select("*")
    .eq("combo_pack_id", id)
    .order("display_order", { ascending: true });

  const varietyIds = (varieties ?? []).map((v) => v.id);
  const { data: items } = varietyIds.length
    ? await supabase
        .from("combo_pack_items")
        .select("*, products(id, sku, name_en, name_ta, price, unit)")
        .in("variety_id", varietyIds)
        .order("display_order", { ascending: true })
    : { data: [] };

  const itemsByVariety = new Map<string, typeof items>();
  for (const item of items ?? []) {
    const list = itemsByVariety.get(item.variety_id) ?? [];
    list.push(item);
    itemsByVariety.set(item.variety_id, list);
  }

  return NextResponse.json({
    comboPack: pack,
    varieties: (varieties ?? []).map((v) => ({ ...v, items: itemsByVariety.get(v.id) ?? [] })),
  });
}

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: z.string().trim().min(1).max(120).optional(),
  tagline: z.string().trim().max(300).nullable().optional(),
  hero_image_url: z.string().trim().max(2000).nullable().optional(),
  badge_text: z.string().trim().max(40).optional(),
  display_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

/** PATCH /api/admin/combo-packs/[id] — pack fields only. No price/cost field exists here to accept (§5.3 MUST NOT). */
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

  const supabase = createAdminClient();
  const { data: updated, error } = await supabase
    .from("combo_packs")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ comboPack: updated });
}

/** DELETE /api/admin/combo-packs/[id] — cascades to its varieties and items. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("combo_packs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });
  return NextResponse.json({ ok: true });
}
