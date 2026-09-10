"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function OrdersFilterBar({
  allStatuses,
  activeStatuses,
  search,
  sort,
  allCities,
  activeCity,
  allCaptains,
  activeCaptain,
}: {
  allStatuses: string[];
  activeStatuses: string[];
  search: string;
  sort: string;
  allCities: string[];
  activeCity: string;
  allCaptains: string[];
  activeCaptain: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(search);

  function updateParams(mutator: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(searchParams.toString());
    mutator(p);
    router.push(`/admin/orders?${p.toString()}`);
  }

  function toggleStatus(status: string) {
    updateParams((p) => {
      const current = p.getAll("status");
      p.delete("status");
      if (current.includes(status)) {
        current.filter((s) => s !== status).forEach((s) => p.append("status", s));
      } else {
        [...current, status].forEach((s) => p.append("status", s));
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParams((p) => (searchInput ? p.set("search", searchInput) : p.delete("search")));
        }}
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search reference, name or phone"
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
      </form>
      <div className="flex flex-wrap gap-1.5">
        {allStatuses.map((s) => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              activeStatuses.includes(s) ? "border-maroon bg-maroon text-white" : "border-border text-ink-soft"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          value={activeCity}
          onChange={(e) => updateParams((p) => (e.target.value ? p.set("city", e.target.value) : p.delete("city")))}
          className="h-9 w-fit rounded-md border border-border bg-surface px-2 text-sm"
        >
          <option value="">All cities</option>
          {allCities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={activeCaptain}
          onChange={(e) => updateParams((p) => (e.target.value ? p.set("captain", e.target.value) : p.delete("captain")))}
          className="h-9 w-fit rounded-md border border-border bg-surface px-2 text-sm"
        >
          <option value="">All captains</option>
          {allCaptains.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => updateParams((p) => p.set("sort", e.target.value))}
          className="h-9 w-fit rounded-md border border-border bg-surface px-2 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="value">Highest value</option>
        </select>
      </div>
    </div>
  );
}
