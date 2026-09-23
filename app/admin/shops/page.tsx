import { createAdminClient } from "@/lib/supabase/admin";
import { ShopsTable } from "@/components/admin/shops-table";

export const dynamic = "force-dynamic";

export default async function AdminShopsPage() {
  const supabase = createAdminClient();
  const { data: shops } = await supabase.from("shops").select("*").order("display_order", { ascending: true });

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl font-semibold text-ink">
          Shops <span className="text-base font-normal text-muted">({shops?.length ?? 0})</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Toggling status takes effect on the live site immediately, no redeploy needed. Hidden shops are only
          reachable via a preview link.
        </p>
      </div>
      <ShopsTable shops={shops ?? []} />
    </div>
  );
}
