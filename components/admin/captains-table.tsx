"use client";

import Link from "next/link";
import { useState } from "react";
import { formatRupees } from "@/lib/format";
import type { CaptainStats } from "@/lib/captain-stats";
import type { Database } from "@/types/database";

type Captain = Database["public"]["Tables"]["captains"]["Row"];

export function CaptainsTable({
  captains,
  stats,
}: {
  captains: Captain[];
  stats: Record<string, CaptainStats>;
}) {
  const [search, setSearch] = useState("");

  const filtered = captains.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or code"
        className="mb-3 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
      />
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-cream text-left text-xs text-muted">
              <th className="p-2">Code</th>
              <th className="p-2">Name</th>
              <th className="p-2">Status</th>
              <th className="p-2 text-right">Orders</th>
              <th className="p-2 text-right">Delivered</th>
              <th className="p-2 text-right">Revenue</th>
              <th className="p-2 text-right">Rate</th>
              <th className="p-2 text-right">Payable</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const s = stats[c.id];
              return (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="p-2 font-mono text-xs">
                    <Link href={`/admin/captains/${c.id}`} className="text-maroon-ink hover:underline">
                      {c.code}
                    </Link>
                  </td>
                  <td className="max-w-[140px] truncate p-2">{c.name}</td>
                  <td className="p-2 text-xs">
                    <span className={c.status === "active" ? "text-teal-ink" : "text-muted"}>{c.status}</span>
                  </td>
                  <td className="p-2 text-right tabular-nums">{s?.totalOrders ?? 0}</td>
                  <td className="p-2 text-right tabular-nums">{s?.deliveredOrders ?? 0}</td>
                  <td className="p-2 text-right tabular-nums">{formatRupees(s?.revenue ?? 0)}</td>
                  <td className="p-2 text-right tabular-nums">{c.commission_rate}%</td>
                  <td className="p-2 text-right tabular-nums">{formatRupees(s?.commissionPayable ?? 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">{filtered.length} captains shown</p>
    </div>
  );
}
