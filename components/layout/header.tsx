"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Menu, Search, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { DiyaIcon } from "@/components/marketing/diya-icon";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { HeaderSearch } from "@/components/layout/header-search";
import type { CategoryRow } from "@/lib/data";
import { brandConfig, getPhoneE164, getPhoneDisplay, getWhatsAppLink } from "@/config/brandConfig";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/#shops", label: "Shops" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

const MOBILE_DRAWER_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/#shops", label: "Shops" },
  { href: "/shipping", label: "Shipping & Delivery" },
  { href: "/about", label: "About us" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/contact", label: "Contact" },
  { href: "/safety", label: "Safety" },
  { href: "/faq", label: "FAQ" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy" },
  { href: "/compliance", label: "Compliance" },
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
            <DiyaIcon size={26} />
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

          <div className="flex flex-1 items-center justify-end gap-1 md:flex-none">
            <ThemeToggle />
            <Link
              href="/search"
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
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 hidden items-center gap-1.5 rounded-full border border-[#25D366] px-4 py-2 text-sm font-semibold text-[#25D366] transition-colors hover:bg-[#25D366] hover:text-white md:inline-flex"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12.031 2.007c-5.511 0-9.986 4.475-9.986 9.985 0 1.761.458 3.483 1.328 4.996l-1.424 5.204 5.32-1.395c1.474.808 3.143 1.233 4.862 1.234h.004c5.509 0 9.985-4.474 9.985-9.984 0-2.67-1.04-5.18-2.929-7.07-1.889-1.89-4.402-2.93-7.072-2.93a.294.294 0 0 0-.088 0zm0 17.585h-.003c-1.492-.001-2.955-.401-4.238-1.161l-.304-.18-3.151.826.84-3.073-.197-.314c-.833-1.325-1.272-2.853-1.272-4.436 0-4.597 3.742-8.338 8.338-8.338 2.228 0 4.324.868 5.899 2.444s2.443 3.673 2.443 5.901c-.001 4.597-3.742 8.338-8.339 8.338l-.016-.007zm4.573-6.248c-.251-.126-1.486-.734-1.716-.818-.23-.084-.398-.126-.565.126-.168.252-.647.818-.794.986-.147.168-.293.189-.544.063-2.14-1.074-3.415-1.745-4.664-3.927-.147-.253.111-.237.545-.717.084-.092.167-.189.251-.285.084-.097.112-.167.168-.278.056-.112.028-.21-.014-.294-.042-.084-.565-1.362-.774-1.865-.203-.491-.41-.424-.565-.431-.147-.008-.314-.008-.482-.008s-.44.063-.67.315c-.23.252-.88 .86-.88 2.096s.901 2.43 1.026 2.597c.126.168 1.77 2.702 4.285 3.788 2.148.927 2.404.743 2.844.7 2.096-.201 1.442-.89 1.631-1.751.04-.184.04-.343.028-.376-.013-.033-.056-.053-.153-.102z" />
              </svg>
              {getPhoneDisplay()}
            </a>
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
            <Link
              href="/"
              onClick={() => setDrawerOpen(false)}
              className="font-display text-lg font-bold text-ink"
            >
              <span className="text-gradient-festival">{brandConfig.brand.name}</span>
            </Link>
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
            {MOBILE_DRAWER_LINKS.map((link, i) => (
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
            ))}
            {categories.length > 0 && (
              <>
                <div className="my-2 border-t border-border" />
                <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
                  Categories
                </div>
              </>
            )}
            {categories.map((cat, i) => (
              <DrawerLink
                key={cat.id}
                href={`/category/${cat.slug}`}
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between pl-4 text-sm"
                delay={MOBILE_DRAWER_LINKS.length + i}
                open={drawerOpen}
                active={pathname === `/category/${cat.slug}`}
              >
                <span>{cat.name_en}</span>
                <ChevronRight size={15} className="text-ink-soft/40" aria-hidden />
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
      style={{ transitionDelay: open ? `${Math.min(delay, 10) * 25}ms` : "0ms" }}
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
