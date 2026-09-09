import { NextResponse } from "next/server";
import { getCategoryWithCounts } from "@/lib/data";

/** GET /api/categories (§22.1). Active categories with product counts, cached 300s. */
export async function GET() {
  try {
    const categories = await getCategoryWithCounts();
    const response = NextResponse.json({ categories });
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return response;
  } catch (error) {
    console.error("GET /api/categories failed", error);
    return NextResponse.json(
      { error: { code: "internal_error", message: "Could not load categories." } },
      { status: 500 },
    );
  }
}
