import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ComboPackDetailClient } from "@/components/admin/combo-pack-detail-client";

export const dynamic = "force-dynamic";

export default async function ComboPackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: comboPack } = await supabase.from("combo_packs").select("*").eq("id", id).maybeSingle();
  if (!comboPack) notFound();

  const [{ data: varieties }, { data: products }] = await Promise.all([
    supabase.from("combo_pack_varieties").select("*").eq("combo_pack_id", id).order("display_order", { ascending: true }),
    supabase.from("products").select("id, sku, name_en, name_ta, price, mrp, unit, status").eq("status", "active").order("name_en"),
  ]);

  const varietyIds = (varieties ?? []).map((v) => v.id);
  const { data: items } = varietyIds.length
    ? await supabase
        .from("combo_pack_items")
        .select("*, products(id, sku, name_en, name_ta, price, unit)")
        .in("variety_id", varietyIds)
        .order("display_order", { ascending: true })
    : { data: [] };

  const itemsByVariety = new Map<string, typeof items>();
  for (const item of items ?? []) {
    const list = itemsByVariety.get(item.variety_id) ?? [];
    list.push(item);
    itemsByVariety.set(item.variety_id, list);
  }

  const varietiesWithItems = (varieties ?? []).map((v) => ({ ...v, items: itemsByVariety.get(v.id) ?? [] }));

  return (
    <ComboPackDetailClient comboPack={comboPack} initialVarieties={varietiesWithItems} allProducts={products ?? []} />
  );
}
