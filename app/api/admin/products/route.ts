import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";

/** GET /api/admin/products (§19.5, §22.2). List with search and category filter, including inactive/archived. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase();
  const category = searchParams.get("category");
  const needsPhoto = searchParams.get("needs_photo") === "true";

  const supabase = createAdminClient();
  let query = supabase
    .from("products")
    .select("*, category:categories(id, slug, name_en)")
    .order("display_order");

  if (category) query = query.eq("category_id", category);
  if (needsPhoto) query = query.is("image_url", null);
  if (q) query = query.or(`name_en.ilike.%${q}%,sku.ilike.%${q}%`);

  const { data, error } = await query.limit(500);
  if (error) return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });

  return NextResponse.json({ products: data });
}

const createSchema = z.object({
  sku: z.string().min(1),
  name_en: z.string().min(1),
  name_ta: z.string().optional(),
  category_id: z.string().uuid(),
  price: z.number().nonnegative().nullable().optional(),
  unit: z.enum(["pkt", "pcs", "box", "bundle"]).optional(),
  is_discountable: z.boolean().optional(),
  min_qty: z.number().int().positive().optional(),
  description: z.string().optional(),
});

/** POST /api/admin/products. Creates a product; slug is always derived server-side from name_en. */
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
  const slug = slugify(parsed.data.name_en);

  const { data: inserted, error } = await supabase
    .from("products")
    .insert({ ...parsed.data, slug })
    .select("*, category:categories(id, slug, name_en)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: { code: "duplicate", message: "A product with this SKU or name already exists." } },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ product: inserted });
}
