"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/products?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/products");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex h-10 w-full max-w-[200px] items-center gap-1.5 rounded-full border border-border bg-surface/50 px-3 transition-colors focus-within:border-maroon md:w-auto",
        className
      )}
    >
      <Search size={16} className="shrink-0 text-muted" aria-hidden />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        aria-label="Search products"
        className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
      />
    </form>
  );
}
