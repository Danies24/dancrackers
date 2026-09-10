import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductDetailClient } from "@/components/admin/product-detail-client";

export const dynamic = "force-dynamic";

export default async function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*, category:categories(id, slug, name_en)").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name_en").order("display_order"),
  ]);

  if (!product) notFound();

  return <ProductDetailClient initialProduct={product} categories={categories ?? []} />;
}
