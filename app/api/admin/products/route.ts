import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
