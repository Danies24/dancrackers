"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import type { CategoryRow } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";

/** §10.3. Sticky, 56px. Mobile: hamburger · wordmark · search · cart badge. */
export function Header({ categories = [] }: { categories?: CategoryRow[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-ink md:hidden"
            >
              <Menu size={22} aria-hidden />
            </button>
            <Link href="/" className="font-display text-lg font-semibold text-maroon">
              {siteConfig.name}
            </Link>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft md:flex">
            <Link href="/products" className="hover:text-maroon">
              Products
            </Link>
            <Link href="/how-it-works" className="hover:text-maroon">
              How it works
            </Link>
            <Link href="/safety" className="hover:text-maroon">
              Safety
            </Link>
            <Link href="/contact" className="hover:text-maroon">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href="/products"
              aria-label="Search products"
              className="flex h-10 w-10 items-center justify-center rounded-md text-ink-soft hover:text-maroon"
            >
              <Search size={20} aria-hidden />
            </Link>
            <Link
              href="/cart"
              aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-md text-ink-soft hover:text-maroon"
            >
              <ShoppingCart size={20} aria-hidden />
              {itemCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon px-1 text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-lg font-semibold text-maroon">
                {siteConfig.name}
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="flex h-10 w-10 items-center justify-center"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto text-ink-soft">
              <DrawerLink href="/" onClick={() => setDrawerOpen(false)}>
                Home
              </DrawerLink>
              <DrawerLink href="/products" onClick={() => setDrawerOpen(false)}>
                All Products
              </DrawerLink>
              {categories.map((cat) => (
                <DrawerLink
                  key={cat.id}
                  href={`/products/${cat.slug}`}
                  onClick={() => setDrawerOpen(false)}
                  className="pl-6 text-sm"
                >
                  {cat.name_en}
                </DrawerLink>
              ))}
              <div className="my-2 border-t border-border" />
              <DrawerLink href="/how-it-works" onClick={() => setDrawerOpen(false)}>
                How It Works
              </DrawerLink>
              <DrawerLink href="/safety" onClick={() => setDrawerOpen(false)}>
                Safety
              </DrawerLink>
              <DrawerLink href="/contact" onClick={() => setDrawerOpen(false)}>
                Contact
              </DrawerLink>
              <DrawerLink href="/about" onClick={() => setDrawerOpen(false)}>
                About
              </DrawerLink>
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <a
                href={`tel:+${siteConfig.operator.phoneE164}`}
                className="rounded-md border-2 border-maroon py-2.5 text-center text-sm font-semibold text-maroon"
              >
                Call us
              </a>
              <a
                href={`https://wa.me/${siteConfig.operator.phoneE164}`}
                target="_blank"
                rel="noopener"
                className="rounded-md bg-whatsapp py-2.5 text-center text-sm font-semibold text-white"
              >
                WhatsApp us
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DrawerLink({
  href,
  children,
  onClick,
  className,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`min-h-11 rounded-md px-2 py-2.5 hover:bg-maroon-tint ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}
