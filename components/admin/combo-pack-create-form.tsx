"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ComboPackCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [badgeText, setBadgeText] = useState("COMBO DEAL");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/combo-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tagline: tagline || undefined, badge_text: badgeText, hero_image_url: heroImageUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Could not create combo pack.");
        return;
      }
      router.push(`/admin/combopacks/${data.comboPack.id}`);
    } catch {
      setError("Could not create combo pack.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {error && <p className="rounded-md border border-red/30 bg-red/5 p-2 text-sm text-red">{error}</p>}
      <label className="text-sm font-medium text-ink">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Kids Special Pack"
          className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
      </label>
      <label className="text-sm font-medium text-ink">
        Tagline
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="One line shown on the card"
          className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
      </label>
      <label className="text-sm font-medium text-ink">
        Badge text
        <input
          value={badgeText}
          onChange={(e) => setBadgeText(e.target.value)}
          className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
      </label>
      <label className="text-sm font-medium text-ink">
        Hero image URL
        <input
          value={heroImageUrl}
          onChange={(e) => setHeroImageUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={submitting || !name}
        className="mt-2 h-11 rounded-full bg-maroon text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create Combo Pack"}
      </button>
    </form>
  );
}
