import { createAdminClient } from "@/lib/supabase/admin";
import { ProductCreateForm } from "@/components/admin/product-create-form";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  const supabase = createAdminClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name_en")
    .order("display_order");

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 font-display text-xl font-semibold text-ink">New Product</h1>
      <ProductCreateForm categories={categories ?? []} />
    </div>
  );
}
