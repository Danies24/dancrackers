import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/admin/shops — the picker list for the CSV importer and any other admin screen that needs "which shop". */
export async function GET() {
  const supabase = createAdminClient();
  const { data: shops, error } = await supabase
    .from("shops")
    .select("id, slug, name_en")
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: { code: "internal_error", message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ shops: shops ?? [] });
}
