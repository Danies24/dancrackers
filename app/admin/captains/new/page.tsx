import { createAdminClient } from "@/lib/supabase/admin";
import { CaptainCreateForm } from "@/components/admin/captain-create-form";

export const dynamic = "force-dynamic";

export default async function AdminNewCaptainPage() {
  const supabase = createAdminClient();
  const { data: captains } = await supabase.from("captains").select("code");

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 font-display text-xl font-semibold text-ink">New Captain</h1>
      <CaptainCreateForm existingCodes={(captains ?? []).map((c) => c.code)} />
    </div>
  );
}
