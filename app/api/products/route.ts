import { NextResponse, type NextRequest } from "next/server";
import { getCatalogue } from "@/lib/data";

/**
 * GET /api/products (§22.1). The whole active catalogue is small (≈40 kB)
 * so the client fetches it once and holds it in memory — filtering, search
 * and sort all happen client-side (§13.4). Query params exist for
 * server-side callers / SEO tools, not because the client needs them.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase();

  try {
    const products = await getCatalogue();
    let filtered = products;
    if (category) filtered = filtered.filter((p) => p.category?.slug === category);
    if (q) {
      filtered = filtered.filter(
        (p) =>
          p.name_en.toLowerCase().includes(q) ||
          p.name_ta?.toLowerCase().includes(q) ||
          p.category?.name_en.toLowerCase().includes(q),
      );
    }

    const response = NextResponse.json({ products: filtered, total: filtered.length });
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return response;
  } catch (error) {
    console.error("GET /api/products failed", error);
    return NextResponse.json(
      { error: { code: "internal_error", message: "Could not load the catalogue." } },
      { status: 500 },
    );
  }
}
