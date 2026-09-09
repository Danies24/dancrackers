import { NextResponse } from "next/server";
import { getProductBySlug, getRelatedProducts } from "@/lib/data";

/** GET /api/products/[slug] (§22.1). 404 if archived or not found. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Product not found." } },
      { status: 404 },
    );
  }

  const related = product.category_id
    ? await getRelatedProducts(product.category_id, product.id)
    : [];

  const response = NextResponse.json({ product, related });
  response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return response;
}
