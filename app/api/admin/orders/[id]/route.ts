import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdminUser } from "@/lib/admin-auth";
import { computeCommissionAmount } from "@/lib/commission";
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
  commissionPaid: z.boolean().optional(),
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
  const { status, lostReason, note, captainCode, commissionPaid } = parsed.data;

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
    .select("internal_notes, captain_id, status, grand_total, commission_amount, commission_paid_at, first_contacted_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: { code: "not_found", message: "Order not found." } }, { status: 404 });
  }

  const update: OrderUpdate = {};
  const autoNotes: string[] = [];

  if (status) {
    update.status = status;
    if (status === "CONFIRMED") update.confirmed_at = new Date().toISOString();
    if (status === "DELIVERED") update.delivered_at = new Date().toISOString();
  }
  if (status === "LOST") update.lost_reason = lostReason;

  // Manual captain override (§20.6) — resolve to captain_id too, on any status,
  // since a deliberate admin correction shouldn't be dropped just because the
  // captain happens to be inactive.
  if (captainCode !== undefined) {
    if (captainCode) {
      const { data: matched } = await supabase.from("captains").select("id").eq("code", captainCode).maybeSingle();
      update.captain_id = matched?.id ?? null;
      update.captain_code = captainCode;
    } else {
      update.captain_id = null;
      update.captain_code = null;
    }
  }

  // Set first_contacted_at once, the first time status ever leaves NEW.
  if (status && status !== "NEW" && !existing.first_contacted_at) {
    update.first_contacted_at = new Date().toISOString();
  }

  // Freeze commission (PRD §20.5) the moment an order enters DELIVERED.
  const enteringDelivered = status === "DELIVERED" && existing.status !== "DELIVERED";
  const leavingDelivered = status !== undefined && status !== "DELIVERED" && existing.status === "DELIVERED";

  if (enteringDelivered) {
    const effectiveCaptainId = update.captain_id !== undefined ? update.captain_id : existing.captain_id;
    if (effectiveCaptainId) {
      const { data: captain } = await supabase
        .from("captains")
        .select("commission_rate")
        .eq("id", effectiveCaptainId)
        .maybeSingle();
      const rate = Number(captain?.commission_rate ?? 0);
      update.commission_rate = rate;
      update.commission_amount = computeCommissionAmount(Number(existing.grand_total), rate);
    }
  } else if (leavingDelivered) {
    if (!existing.commission_paid_at) {
      update.commission_rate = null;
      update.commission_amount = null;
    } else {
      autoNotes.push(
        `Reverted from DELIVERED to ${status} — commission (${existing.commission_amount ?? 0}, already paid) left unchanged. Review manually.`,
      );
    }
  }

  if (commissionPaid !== undefined) {
    update.commission_paid_at = commissionPaid ? new Date().toISOString() : null;
  }

  if (note) autoNotes.push(note);
  if (autoNotes.length > 0) {
    const notes = Array.isArray(existing.internal_notes) ? existing.internal_notes : [];
    update.internal_notes = [
      ...notes,
      ...autoNotes.map((text) => ({ at: new Date().toISOString(), by: admin?.name ?? "admin", text })),
    ];
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
