import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const createSchema = z.object({
  tier_label: z.string().trim().min(1).max(40),
});

/** POST /api/admin/combo-packs/[id]/varieties — add a tier (e.g. an "XL") to an existing pack, starting empty. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Invalid request", fields: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data: pack } = await supabase.from("combo_packs").select("slug").eq("id", id).maybeSingle();
  if (!pack) return NextResponse.json({ error: { code: "not_found", message: "Combo pack not found." } }, { status: 404 });

  const { count } = await supabase
    .from("combo_pack_varieties")
    .select("*", { count: "exact", head: true })
    .eq("combo_pack_id", id);

  const { data: variety, error } = await supabase
    .from("combo_pack_varieties")
    .insert({
      combo_pack_id: id,
      slug: `${pack.slug}-${slugify(parsed.data.tier_label)}`,
      tier_label: parsed.data.tier_label,
      display_order: (count ?? 0) + 1,
    })
    .select("*")
    .single();

  if (error || !variety) {
    return NextResponse.json(
      { error: { code: "internal_error", message: error?.message ?? "Could not add variety." } },
      { status: 500 },
    );
  }

  return NextResponse.json({ variety }, { status: 201 });
}
