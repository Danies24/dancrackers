import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeCaptainStats } from "@/lib/captain-stats";
import { CaptainsTable } from "@/components/admin/captains-table";

export const dynamic = "force-dynamic";

export default async function AdminCaptainsPage() {
  const supabase = createAdminClient();

  const [{ data: captains }, { data: orders }] = await Promise.all([
    supabase.from("captains").select("*").order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("captain_id, customer_id, status, grand_total, commission_amount, commission_paid_at")
      .not("captain_id", "is", null),
  ]);

  const statsByCaptain = computeCaptainStats(orders ?? []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink">
          Captains <span className="text-base font-normal text-muted">({captains?.length ?? 0})</span>
        </h1>
        <Link href="/admin/captains/new" className="rounded-md bg-maroon px-3 py-2 text-sm font-semibold text-white">
          + New Captain
        </Link>
      </div>
      <CaptainsTable
        captains={captains ?? []}
        stats={Object.fromEntries(statsByCaptain)}
      />
    </div>
  );
}
