"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Today" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
];

export function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-secondary-bg text-ink">
      <div className="flex h-14 items-center justify-between px-4">
        <span className="font-display text-sm font-semibold">Dan Crackers Admin</span>
        <button onClick={signOut} className="text-xs text-ink-soft hover:text-ink">
          Sign out ({userName})
        </button>
      </div>
      <nav className="flex border-t border-border">
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex-1 py-3 text-center text-sm font-medium",
                active ? "border-b-2 border-gold-ink text-ink" : "text-ink-soft",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
