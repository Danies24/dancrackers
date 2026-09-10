import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  code: z.string().regex(/^[A-Z]{3}[0-9]{2}$/, "Code must be 3 letters + 2 digits, e.g. RAJ12"),
  commission_rate: z.number().min(0).max(100).optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  source: z.string().optional(),
  upi_id: z.string().optional(),
  notes: z.string().optional(),
});

function generateToken(): string {
  return randomUUID().replace(/-/g, "").slice(0, 16);
}

/** POST /api/admin/captains. Creates a captain; token is always server-generated. */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Invalid request", fields: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  let token = generateToken();

  let { data: inserted, error } = await supabase
    .from("captains")
    .insert({ ...parsed.data, token })
    .select("*")
    .single();

  if (error?.code === "23505" && error.message.includes("token")) {
    // Astronomically unlikely — retry once with a fresh token, never surface to the admin.
    token = generateToken();
    ({ data: inserted, error } = await supabase
      .from("captains")
      .insert({ ...parsed.data, token })
      .select("*")
      .single());
  }

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: { code: "duplicate", message: "A captain with this code already exists — try a different one." } },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ captain: inserted });
}
