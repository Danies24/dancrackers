import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductsTable } from "@/components/admin/products-table";
import { getPricingSettings } from "@/lib/pricing-settings";

export const dynamic = "force-dynamic";

/**
 * `?shop=<slug>` scopes the query to one shop's own products, server-side —
 * without it, the page falls back to the old cross-shop `.limit(500)` view
 * (multiple shops now push the real total past 500, so that view was
 * already silently truncating; scoping to one shop sidesteps it rather than
 * raising the cap, since "all shops, unbounded" isn't a page anyone needs).
 */
export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ shop?: string }> }) {
  const { shop: shopSlug } = await searchParams;
  const supabase = createAdminClient();

  const { data: shops } = await supabase.from("shops").select("id, slug, name_en").order("display_order");
  const selectedShop = shopSlug ? (shops ?? []).find((s) => s.slug === shopSlug) : null;

  let query = supabase.from("products").select("*, category:categories(id, slug, name_en)").order("display_order");
  query = selectedShop ? query.eq("shop_id", selectedShop.id) : query.limit(500);

  const [{ data: products }, pricingSettings] = await Promise.all([query, getPricingSettings()]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink">
          Products <span className="text-base font-normal text-muted">({products?.length ?? 0})</span>
        </h1>
        <div className="flex gap-2">
          <Link href="/admin/products/new" className="rounded-md bg-maroon px-3 py-2 text-sm font-semibold text-white">
            + New Product
          </Link>
          <Link
            href="/admin/products/import"
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink"
          >
            Import CSV
          </Link>
          <Link
            href="/admin/products/photos"
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink"
          >
            Bulk Photos
          </Link>
        </div>
      </div>
      <ProductsTable
        initialProducts={products ?? []}
        initialPricingSettings={pricingSettings}
        shops={shops ?? []}
        selectedShopSlug={selectedShop?.slug ?? "all"}
      />
    </div>
  );
}
