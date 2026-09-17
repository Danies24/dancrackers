import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdminUser } from "@/lib/admin-auth";
import { getPricingSettings, updatePricingSettings } from "@/lib/pricing-settings";

/** GET /api/admin/pricing-settings. Service-role only — never exposed to anon/authenticated. */
export async function GET() {
  const settings = await getPricingSettings();
  return NextResponse.json({ settings });
}

const patchSchema = z
  .object({
    supplierDiscountPercent: z.number().min(0).max(100).optional(),
    defaultDiscountPercent: z.number().min(0).max(100).optional(),
    defaultNetMarkupPercent: z.number().min(0).max(100).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field." });

export async function PATCH(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Invalid request", fields: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  const admin = await getCurrentAdminUser();
  const { error } = await updatePricingSettings(parsed.data, admin?.email ?? "admin");
  if (error) {
    return NextResponse.json({ error: { code: "internal_error", message: error } }, { status: 500 });
  }

  const settings = await getPricingSettings();
  return NextResponse.json({ settings });
}
