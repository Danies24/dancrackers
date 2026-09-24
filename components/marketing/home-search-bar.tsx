"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const ROTATING_TERMS = ["sparklers", "flower pots", "gift boxes", "ground chakkars", "சக்கரம்", "sound crackers"];
const ROTATE_INTERVAL_MS = 2600;

/**
 * Home v2's search bar (Swiggy-redesign plan) — text only, no voice search
 * (dropped per the confirmed scope decision). Submitting routes to
 * /products?q=..., which redirects straight to /category/[slug] when the
 * query confidently matches a category (the common case — searching a
 * cracker type), or falls back to /products' own shop-switcher view
 * otherwise. No second search implementation lives here.
 */
export function HomeSearchBar() {
  const router = useRouter();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIndex((i) => (i + 1) % ROTATING_TERMS.length), ROTATE_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : "/products");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 shadow-soft">
      <Search size={18} className="shrink-0 text-muted" aria-hidden />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${ROTATING_TERMS[placeholderIndex]}...`}
        aria-label="Search products"
        className="w-full bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none"
      />
    </form>
  );
}
