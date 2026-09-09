import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { getSettings } from "@/lib/data";

const bodySchema = z.object({
  productIds: z.array(z.string().uuid()).max(500),
});

export interface ValidateResultItem {
  productId: string;
  exists: boolean;
  status: string | null;
  price: number | null;
  isDiscountable: boolean | null;
  name_en: string | null;
  name_ta: string | null;
  unit: string | null;
  image_url: string | null;
  sku: string | null;
  slug: string | null;
}

/**
 * POST /api/products/validate (§15.3, §22.1). Powers cart/enquiry
 * revalidation: current price, status, and whether the product still
 * exists, per item — plus the settings the client needs to compute totals
 * locally (discount_percent, min_order_value) without a separate endpoint.
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
    .from("products")
    .select("id, status, price, is_discountable, name_en, name_ta, unit, image_url, sku, slug")
    .in("id", productIds);

  if (error) {
    return NextResponse.json(
      { error: { code: "internal_error", message: "Could not validate cart." } },
      { status: 500 },
    );
  }

  const byId = new Map(data.map((p) => [p.id, p]));
  const items: ValidateResultItem[] = productIds.map((id) => {
    const p = byId.get(id);
    if (!p)
      return {
        productId: id,
        exists: false,
        status: null,
        price: null,
        isDiscountable: null,
        name_en: null,
        name_ta: null,
        unit: null,
        image_url: null,
        sku: null,
        slug: null,
      };
    return {
      productId: id,
      exists: true,
      status: p.status,
      price: p.price,
      isDiscountable: p.is_discountable,
      name_en: p.name_en,
      name_ta: p.name_ta,
      unit: p.unit,
      image_url: p.image_url,
      sku: p.sku,
      slug: p.slug,
    };
  });

  const settings = await getSettings();

  return NextResponse.json({
    items,
    settings: {
      discountPercent: Number(settings.discount_percent ?? 0),
      minOrderValue: Number(settings.min_order_value ?? 0),
    },
  });
}
