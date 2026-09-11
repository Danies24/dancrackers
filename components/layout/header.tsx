"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import type { CategoryRow } from "@/lib/data";
import { brandConfig, getPhoneE164 } from "@/config/brandConfig";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

/** Sticky nav — transparent over the hero, blurred white with a border once scrolled. */
export function Header({ categories = [] }: { categories?: CategoryRow[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { itemCount } = useCart();
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || !isHome;

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header
        className={cn(
          "sticky top-0 z-40 h-16 transition-colors duration-300",
          solid ? "border-b border-border bg-cream/90 backdrop-blur-md" : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((v) => !v)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink md:hidden"
            >
              <Menu size={22} aria-hidden className={cn("absolute transition-all duration-200", drawerOpen ? "scale-0 opacity-0" : "scale-100 opacity-100")} />
              <X size={22} aria-hidden className={cn("absolute transition-all duration-200", drawerOpen ? "scale-100 opacity-100" : "scale-0 opacity-0")} />
            </button>
            <Link href="/" className="font-display text-lg font-bold text-ink">
              <span className="text-gradient-festival">{brandConfig.brand.name}</span>
            </Link>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors hover:text-maroon-ink",
                  pathname.startsWith(link.href) && link.href !== "/" && "text-maroon-ink",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href="/products"
              aria-label="Search products"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-ink-soft transition-colors hover:border-maroon hover:text-maroon-ink"
            >
              <Search size={18} aria-hidden />
            </Link>
            <Link
              href="/cart"
              aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-maroon-ink md:hidden"
            >
              <ShoppingCart size={20} aria-hidden />
              {itemCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-primary px-1 text-[10px] font-semibold text-on-fill">
                  {itemCount}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-border text-ink-soft transition-colors hover:border-maroon hover:text-maroon-ink md:flex"
              aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
            >
              <ShoppingCart size={18} aria-hidden />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-primary px-1 text-[10px] font-semibold text-on-fill">
                  {itemCount}
                </span>
              )}
            </Link>
            <Link
              href={isHome ? "#enquiry" : "/#enquiry"}
              className="ml-2 hidden items-center gap-1 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-on-fill transition-all hover:-translate-y-0.5 hover:glow-orange md:inline-flex"
            >
              Enquire Now
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer — slides + fades, items stagger in (modern app feel). */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!drawerOpen}
      >
        <button
          aria-label="Close menu"
          className={cn("absolute inset-0 bg-black/60 transition-opacity duration-300", drawerOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setDrawerOpen(false)}
          tabIndex={drawerOpen ? 0 : -1}
        />
        <div
          className={cn(
            "absolute inset-x-0 top-0 flex max-h-[85vh] flex-col overflow-y-auto rounded-b-3xl border-b border-border bg-secondary-bg p-5 shadow-2xl transition-all duration-300 ease-out",
            drawerOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
          )}
        >
          <div className="mb-4 flex items-center justify-between pt-10">
            <span className="font-display text-lg font-bold text-ink">{brandConfig.brand.name}</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-black/5 hover:text-ink"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {[{ href: "/", label: "Home" }, { href: "/products", label: "All Products" }, ...NAV_LINKS.filter((l) => l.href !== "/products")].map(
              (link, i) => (
                <DrawerLink
                  key={link.href}
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  delay={i}
                  open={drawerOpen}
                  active={pathname === link.href}
                >
                  {link.label}
                </DrawerLink>
              ),
            )}
            {categories.length > 0 && <div className="my-2 border-t border-border" />}
            {categories.slice(0, 6).map((cat, i) => (
              <DrawerLink
                key={cat.id}
                href={`/products/${cat.slug}`}
                onClick={() => setDrawerOpen(false)}
                className="pl-6 text-sm"
                delay={i + 5}
                open={drawerOpen}
                active={pathname === `/products/${cat.slug}`}
              >
                {cat.name_en}
              </DrawerLink>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
            <a
              href={`tel:+${getPhoneE164()}`}
              className="rounded-full border border-border py-2.5 text-center text-sm font-semibold text-ink"
            >
              Call us
            </a>
            <a
              href={`https://wa.me/${getPhoneE164()}`}
              target="_blank"
              rel="noopener"
              className="rounded-full bg-whatsapp py-2.5 text-center text-sm font-semibold text-white"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

function DrawerLink({
  href,
  children,
  onClick,
  className,
  delay,
  open,
  active,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  delay: number;
  open: boolean;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={{ transitionDelay: open ? `${delay * 35}ms` : "0ms" }}
      className={cn(
        "min-h-11 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-maroon-tint hover:text-ink",
        active ? "bg-maroon-tint font-semibold text-maroon-ink" : "text-ink-soft",
        open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
        className,
      )}
    >
      {children}
    </Link>
  );
}
