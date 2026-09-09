import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductsTable } from "@/components/admin/products-table";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(id, slug, name_en)")
    .order("display_order")
    .limit(500);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink">
          Products <span className="text-base font-normal text-muted">({products?.length ?? 0})</span>
        </h1>
        <Link href="/admin/products/import" className="rounded-md bg-maroon px-3 py-2 text-sm font-semibold text-white">
          Import CSV
        </Link>
      </div>
      <ProductsTable initialProducts={products ?? []} />
    </div>
  );
}
