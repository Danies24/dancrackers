import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_TIERS = ["Small", "Medium", "Large"];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** GET /api/admin/combo-packs — list, each with its varieties (for the summary counts/prices in the list view). */
export async function GET() {
  const supabase = createAdminClient();
  const { data: packs, error } = await supabase.from("combo_packs").select("*").order("display_order", { ascending: true });
  if (error) return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });

  const { data: varieties } = await supabase
    .from("combo_pack_varieties")
    .select("*")
    .order("display_order", { ascending: true });

  const varietiesByPack = new Map<string, typeof varieties>();
  for (const v of varieties ?? []) {
    const list = varietiesByPack.get(v.combo_pack_id) ?? [];
    list.push(v);
    varietiesByPack.set(v.combo_pack_id, list);
  }

  return NextResponse.json({
    comboPacks: (packs ?? []).map((p) => ({ ...p, varieties: varietiesByPack.get(p.id) ?? [] })),
  });
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120).optional(),
  tagline: z.string().trim().max(300).optional(),
  hero_image_url: z.string().trim().url().optional().or(z.literal("")),
  badge_text: z.string().trim().max(40).optional(),
  display_order: z.number().int().optional(),
});

/** POST /api/admin/combo-packs — create a pack, seeded with the 3 default (empty) tiers. */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Invalid request", fields: parsed.error.flatten() } },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const slug = input.slug ? slugify(input.slug) : slugify(input.name);

  const supabase = createAdminClient();
  const { data: pack, error } = await supabase
    .from("combo_packs")
    .insert({
      name: input.name,
      slug,
      tagline: input.tagline || null,
      hero_image_url: input.hero_image_url || null,
      badge_text: input.badge_text || "COMBO DEAL",
      display_order: input.display_order ?? 0,
    })
    .select("*")
    .single();

  if (error || !pack) {
    return NextResponse.json(
      { error: { code: "internal_error", message: error?.message ?? "Could not create combo pack." } },
      { status: 500 },
    );
  }

  const varietyRows = DEFAULT_TIERS.map((tier, i) => ({
    combo_pack_id: pack.id,
    slug: `${slug}-${slugify(tier)}`,
    tier_label: tier,
    display_order: i + 1,
  }));
  await supabase.from("combo_pack_varieties").insert(varietyRows);

  return NextResponse.json({ comboPack: pack }, { status: 201 });
}
