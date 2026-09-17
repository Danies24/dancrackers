import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesUpdate } from "@/types/database";

/**
 * The private, service-role-only pricing config (supplier discount %, and
 * the defaults new products are created with). Never readable by anon/
 * authenticated clients — see the `pricing_settings` migration.
 */
export interface PricingSettings {
  supplierDiscountPercent: number;
  defaultDiscountPercent: number;
  defaultNetMarkupPercent: number;
}

const FALLBACK_DEFAULTS: PricingSettings = {
  supplierDiscountPercent: 90,
  defaultDiscountPercent: 80,
  defaultNetMarkupPercent: 10,
};

export async function getPricingSettings(): Promise<PricingSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pricing_settings")
    .select("supplier_discount_percent, default_discount_percent, default_net_markup_percent")
    .eq("id", true)
    .single();

  if (error || !data) {
    console.error("[pricing-settings] could not load pricing_settings, using fallback defaults", error);
    return FALLBACK_DEFAULTS;
  }

  return {
    supplierDiscountPercent: Number(data.supplier_discount_percent),
    defaultDiscountPercent: Number(data.default_discount_percent),
    defaultNetMarkupPercent: Number(data.default_net_markup_percent),
  };
}

export async function updatePricingSettings(
  patch: Partial<PricingSettings>,
  updatedBy: string,
): Promise<{ error: string | null }> {
  const supabase = createAdminClient();
  const payload: TablesUpdate<"pricing_settings"> = { updated_at: new Date().toISOString(), updated_by: updatedBy };
  if (patch.supplierDiscountPercent != null) payload.supplier_discount_percent = patch.supplierDiscountPercent;
  if (patch.defaultDiscountPercent != null) payload.default_discount_percent = patch.defaultDiscountPercent;
  if (patch.defaultNetMarkupPercent != null) payload.default_net_markup_percent = patch.defaultNetMarkupPercent;

  const { error } = await supabase.from("pricing_settings").update(payload).eq("id", true);
  return { error: error?.message ?? null };
}
