import { createAdminClient } from "@/lib/supabase/admin";
import { LeadCard } from "@/components/admin/lead-card";

/**
 * The homepage's quick-enquiry form (a callback request, no cart/order
 * behind it) previously had no admin view at all — only a Telegram ping,
 * easy to miss and impossible to find again afterwards. This is that view.
 */
export default async function AdminLeadsPage() {
  const supabase = createAdminClient();
  const { data: leads } = await supabase
    .from("general_enquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = leads ?? [];
  const newCount = rows.filter((l) => l.status === "NEW").length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink">
          Leads <span className="text-base font-normal text-muted">({rows.length})</span>
        </h1>
        {newCount > 0 && (
          <span className="rounded-full bg-maroon-tint px-2.5 py-1 text-xs font-semibold text-maroon-ink">
            {newCount} new
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-muted">
        Quick &ldquo;call me back&rdquo; requests from the homepage — separate from priced orders, which live under Orders.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No leads yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
