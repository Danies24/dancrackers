import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  city: z.string().nullable().optional(),
  area: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  upi_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  commission_rate: z.number().min(0).max(100).optional(),
});

/** PATCH /api/admin/captains/[id]. code and token are never editable here. */
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
    .from("captains")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ captain: updated });
}
