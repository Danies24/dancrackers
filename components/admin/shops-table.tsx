"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/database";

type Shop = Database["public"]["Tables"]["shops"]["Row"];

const STATUS_LABEL: Record<string, string> = {
  active: "Active (visible + orderable)",
  hidden: "Hidden (preview-link only)",
  coming_soon: "Coming soon (visible, not orderable)",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-teal-tint text-teal-ink",
  hidden: "bg-border text-ink-soft",
  coming_soon: "bg-gold-tint text-gold-ink",
};

/**
 * The "hide/unhide a shop with a click" admin screen — a shop's `status`
 * (active/hidden/coming_soon) is the one field the public storefront
 * actually reads to decide visibility (lib/shops.ts, lib/cross-shop.ts).
 * Toggling here takes effect immediately, no redeploy needed.
 */
export function ShopsTable({ shops }: { shops: Shop[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  async function setStatus(shop: Shop, status: string) {
    if (status === shop.status) return;
    setPendingId(shop.id);
    setErrorId(null);
    try {
      const res = await fetch(`/api/admin/shops/${shop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      router.refresh();
    } catch {
      setErrorId(shop.id);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-cream text-left text-xs text-muted">
            <th className="p-2">Shop</th>
            <th className="p-2">Slug</th>
            <th className="p-2">Status</th>
            <th className="p-2">Set status</th>
          </tr>
        </thead>
        <tbody>
          {shops.map((shop) => (
            <tr key={shop.id} className="border-b border-border last:border-0">
              <td className="p-2 font-medium text-ink">{shop.name_en}</td>
              <td className="p-2 text-muted">{shop.slug}</td>
              <td className="p-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[shop.status] ?? "bg-border text-ink-soft"}`}>
                  {STATUS_LABEL[shop.status] ?? shop.status}
                </span>
              </td>
              <td className="p-2">
                <div className="flex flex-wrap gap-1.5">
                  {(["active", "hidden", "coming_soon"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={pendingId === shop.id || status === shop.status}
                      onClick={() => setStatus(shop, status)}
                      className={`rounded-md border px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                        status === shop.status ? "border-maroon bg-maroon-tint text-maroon-ink" : "border-border text-ink-soft hover:border-maroon-ink"
                      }`}
                    >
                      {status === "coming_soon" ? "Coming soon" : status[0].toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
                {errorId === shop.id && <p className="mt-1 text-xs text-red-ink">Couldn&apos;t update — try again.</p>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
