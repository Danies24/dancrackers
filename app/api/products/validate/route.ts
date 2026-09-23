import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { getComboUiPrice } from "@/lib/combo-packs";

const bodySchema = z.object({
  productIds: z.array(z.string().uuid()).max(500),
});

export interface ValidateResultItem {
  productId: string;
  exists: boolean;
  status: string | null;
  price: number | null;
  /** Only present for discountable items — null for net-rate items and for anything not orderable. */
  mrp: number | null;
  discountPercent: number | null;
  isDiscountable: boolean | null;
  name_en: string | null;
  name_ta: string | null;
  unit: string | null;
  image_url: string | null;
  sku: string | null;
  slug: string | null;
  shopSlug: string | null;
}

/**
 * POST /api/products/validate. Powers cart/enquiry revalidation: current
 * price, status, and whether the product still exists, per item. Reads
 * exclusively from `public_products` — the customer-safe view — so a
 * net-rate item's real supplier rate (its mrp column) never reaches this
 * response even indirectly; the view itself nulls it out at the source.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Invalid request", fields: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  const { productIds } = parsed.data;
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("public_products")
    .select("id, status, price, mrp, discount_percent, is_discountable, name_en, name_ta, unit, image_url, sku, slug, shop_slug")
    .in("id", productIds);

  if (error) {
    return NextResponse.json(
      { error: { code: "internal_error", message: "Could not validate cart." } },
      { status: 500 },
    );
  }

  const byId = new Map(data.map((p) => [p.id, p]));
  const stillMissing = productIds.filter((id) => !byId.has(id));

  // A combo pack variety's id lives in combo_pack_varieties, not products —
  // resolve anything a plain products lookup missed against that table
  // before giving up on it. See supabase/migrations/20260918000001_combo_packs.sql.
  if (stillMissing.length > 0) {
    // The generated type for this VIEW marks every column nullable — same
    // known issue as public_products, hand-corrected the same way (see
    // lib/data.ts's ProductRow / lib/combo-packs.ts's PublicComboVarietyRow).
    const { data: rawCombos } = await supabase
      .from("public_combo_pack_varieties")
      .select("id, slug, tier_label, selling_price, combo_pack_id")
      .in("id", stillMissing);
    const combos = (rawCombos ?? []) as unknown as Array<{
      id: string;
      slug: string;
      tier_label: string;
      selling_price: number;
      combo_pack_id: string;
    }>;
    if (combos.length > 0) {
      const packIds = [...new Set(combos.map((c) => c.combo_pack_id))];
      const { data: packs } = await supabase.from("combo_packs").select("id, name, hero_image_url").in("id", packIds);
      const packById = new Map((packs ?? []).map((p) => [p.id, p]));
      for (const c of combos) {
        const pack = packById.get(c.combo_pack_id);
        byId.set(c.id, {
          id: c.id,
          status: "active",
          price: getComboUiPrice(c.slug, c.selling_price),
          mrp: null,
          discount_percent: null,
          is_discountable: false,
          name_en: pack ? `${pack.name} — ${c.tier_label}` : c.tier_label,
          name_ta: null,
          unit: "pack",
          image_url: pack?.hero_image_url ?? null,
          sku: `COMBO-${c.slug.toUpperCase()}`,
          slug: c.slug,
          shop_slug: "sri-ram-crackers", // combo packs are Sri Ram-only for now (multi-shop spec §5.6)
        });
      }
    }
  }

  const items: ValidateResultItem[] = productIds.map((id) => {
    const p = byId.get(id);
    if (!p)
      return {
        productId: id,
        exists: false,
        status: null,
        price: null,
        mrp: null,
        discountPercent: null,
        isDiscountable: null,
        name_en: null,
        name_ta: null,
        unit: null,
        image_url: null,
        sku: null,
        slug: null,
        shopSlug: null,
      };
    return {
      productId: id,
      exists: true,
      status: p.status,
      price: p.price,
      mrp: p.mrp,
      discountPercent: p.discount_percent,
      isDiscountable: p.is_discountable,
      name_en: p.name_en,
      name_ta: p.name_ta,
      unit: p.unit,
      image_url: p.image_url,
      sku: p.sku,
      slug: p.slug,
      shopSlug: p.shop_slug,
    };
  });

  return NextResponse.json({ items });
}
