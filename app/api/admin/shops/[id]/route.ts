import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const patchSchema = z.object({
  status: z.enum(["active", "hidden", "coming_soon"]).optional(),
  tagline: z.string().nullable().optional(),
  display_order: z.number().int().optional(),
});

/**
 * PATCH /api/admin/shops/[id] — the "hide/unhide a shop with a click" admin
 * capability (Swiggy-redesign follow-up). Only status/tagline/display_order
 * are editable here; pricing fields (markup_percent etc.) stay out of scope
 * for this one-purpose route.
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

  const supabase = createAdminClient();
  const { data: updated, error } = await supabase.from("shops").update(parsed.data).eq("id", id).select("*").single();

  if (error) {
    return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ shop: updated });
}
