import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ComboPacksTable } from "@/components/admin/combo-packs-table";

export const dynamic = "force-dynamic";

export default async function AdminComboPacksPage() {
  const supabase = createAdminClient();
  const [{ data: packs }, { data: varieties }] = await Promise.all([
    supabase.from("combo_packs").select("*").order("display_order", { ascending: true }),
    supabase.from("combo_pack_varieties").select("id, combo_pack_id, tier_label, selling_price").order("display_order", { ascending: true }),
  ]);

  const varietiesByPack = new Map<string, typeof varieties>();
  for (const v of varieties ?? []) {
    const list = varietiesByPack.get(v.combo_pack_id) ?? [];
    list.push(v);
    varietiesByPack.set(v.combo_pack_id, list);
  }
  const rows = (packs ?? []).map((p) => ({ ...p, varieties: varietiesByPack.get(p.id) ?? [] }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink">
          Combo Packs <span className="text-base font-normal text-muted">({rows.length})</span>
        </h1>
        <Link href="/admin/combopacks/new" className="rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-white">
          + New Combo Pack
        </Link>
      </div>
      <ComboPacksTable comboPacks={rows} />
    </div>
  );
}
