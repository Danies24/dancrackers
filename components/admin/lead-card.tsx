"use client";

import { useState } from "react";
import { formatIST } from "@/lib/format";
import type { Database } from "@/types/database";

type Lead = Database["public"]["Tables"]["general_enquiries"]["Row"];

const STATUSES = ["NEW", "CONTACTED", "CLOSED"] as const;

const statusColors: Record<string, string> = {
  NEW: "bg-maroon-tint text-maroon-ink",
  CONTACTED: "bg-gold-tint text-gold",
  CLOSED: "bg-black/10 text-ink-soft",
};

/** A homepage quick-enquiry lead — name/phone/callback request, no cart or order behind it. */
export function LeadCard({ lead: initialLead }: { lead: Lead }) {
  const [lead, setLead] = useState(initialLead);
  const [saving, setSaving] = useState(false);

  async function updateStatus(status: (typeof STATUSES)[number]) {
    setSaving(true);
    setLead((prev) => ({ ...prev, status }));
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("update failed");
    } catch {
      setLead(initialLead);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{lead.name}</p>
          <p className="text-xs text-muted">
            {lead.phone} · {formatIST(lead.created_at)}
            {lead.category && <> · {lead.category}</>}
          </p>
          {lead.email && <p className="text-xs text-muted">{lead.email}</p>}
          {lead.message && <p className="mt-1 text-sm text-ink-soft">&ldquo;{lead.message}&rdquo;</p>}
        </div>
        <span
          className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${statusColors[lead.status] ?? ""}`}
        >
          {lead.status}
        </span>
      </div>

      <div className="mt-2 flex gap-2">
        <a
          href={`tel:+91${lead.phone}`}
          className="flex-1 rounded-md border border-maroon py-1.5 text-center text-xs font-semibold text-maroon-ink"
        >
          Call
        </a>
        <a
          href={`https://wa.me/91${lead.phone}`}
          target="_blank"
          rel="noopener"
          className="flex-1 rounded-md bg-whatsapp py-1.5 text-center text-xs font-semibold text-white"
        >
          WhatsApp
        </a>
        <select
          value={lead.status}
          disabled={saving}
          onChange={(e) => updateStatus(e.target.value as (typeof STATUSES)[number])}
          className="flex-1 rounded-md border border-border bg-surface px-2 text-center text-xs font-semibold text-ink disabled:opacity-50"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
