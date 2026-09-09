import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdminUser } from "@/lib/admin-auth";
import type { Database } from "@/types/database";

type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

const LOST_REASONS = ["price", "timing", "already bought", "no delivery to area", "unreachable", "other"] as const;
const STATUSES = [
  "NEW",
  "CONTACTED",
  "UNREACHABLE",
  "CONFIRMED",
  "PAID",
  "DESPATCHED",
  "DELIVERED",
  "LOST",
  "SPAM",
] as const;

/** GET /api/admin/orders/[id] (§19.4, §22.2). Full detail with item snapshot. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: order, error }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id),
  ]);

  if (error || !order) {
    return NextResponse.json({ error: { code: "not_found", message: "Order not found." } }, { status: 404 });
  }

  return NextResponse.json({ order, items: items ?? [] });
}

const patchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  lostReason: z.enum(LOST_REASONS).optional(),
  note: z.string().max(2000).optional(),
  captainCode: z.string().trim().toUpperCase().nullable().optional(),
});

/** PATCH /api/admin/orders/[id] (§19.4, §22.2). Status transitions, append-only notes, captain override. */
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
  const { status, lostReason, note, captainCode } = parsed.data;

  if (status === "LOST" && !lostReason) {
    return NextResponse.json(
      { error: { code: "lost_reason_required", message: "A reason is required when marking an order LOST." } },
      { status: 400 },
    );
  }

  const admin = await getCurrentAdminUser();
  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("orders")
    .select("internal_notes")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: { code: "not_found", message: "Order not found." } }, { status: 404 });
  }

  const update: OrderUpdate = {};
  if (status) {
    update.status = status;
    if (status === "CONTACTED" || status === "CONFIRMED") {
      // first_contacted_at is the SLA measurement (§21.7) — set once, on first contact.
    }
    if (status === "CONFIRMED") update.confirmed_at = new Date().toISOString();
    if (status === "DELIVERED") update.delivered_at = new Date().toISOString();
  }
  if (status === "LOST") update.lost_reason = lostReason;
  if (captainCode !== undefined) update.captain_code = captainCode;

  if (note) {
    const notes = Array.isArray(existing.internal_notes) ? existing.internal_notes : [];
    update.internal_notes = [
      ...notes,
      { at: new Date().toISOString(), by: admin?.name ?? "admin", text: note },
    ];
  }

  // Set first_contacted_at once, the first time status ever leaves NEW.
  if (status && status !== "NEW") {
    const { data: current } = await supabase.from("orders").select("first_contacted_at").eq("id", id).maybeSingle();
    if (current && !current.first_contacted_at) {
      update.first_contacted_at = new Date().toISOString();
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("orders")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: { code: "internal_error", message: updateError.message } }, { status: 500 });
  }

  return NextResponse.json({ order: updated });
}
