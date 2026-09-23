import Link from "next/link";
import { ShieldCheck, Tag, Truck, Headphones, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SparkField } from "@/components/marketing/spark-field";
import { GeneralEnquiryForm } from "@/components/marketing/general-enquiry-form";
import { OrderCountdownHero } from "@/components/marketing/order-countdown-hero";
import { HomeSearchBar } from "@/components/marketing/home-search-bar";
import { HeroBannerCarousel, type HeroBannerSlide } from "@/components/marketing/hero-banner-carousel";
import { ShopCard } from "@/components/shop/shop-card";
import { CategoryGroupTile } from "@/components/shop/category-group-tile";
import { ProductCard } from "@/components/product/product-card";
import { getCategoryWithCounts } from "@/lib/data";
import { getShopsForHomeRail } from "@/lib/shops";
import { getFeaturedCategoryGroups } from "@/lib/category-groups";
import { getCrossShopProducts } from "@/lib/cross-shop";
import { brandConfig, getCanonicalUrl } from "@/config/brandConfig";
import { formatRupees } from "@/lib/format";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Kolagalam (கோலாகலம்) — Sivakasi Crackers Price List",
  },
  description:
    "Browse 2026 Sivakasi crackers price list from Kolagalam (கோலாகலம்). Premium sparklers, rockets, ground chakkars & gift boxes direct to your door.",
  alternates: {
    canonical: getCanonicalUrl("/"),
  },
};

export const revalidate = 300;

const HERO_SLIDES: HeroBannerSlide[] = [
  {
    id: "brand",
    imageUrl: "/images/hero/kolagalam-brand.webp",
    eyebrow: "DIWALI 2026",
  },
  {
    id: "all-shops-one-place",
    imageUrl: "/images/hero/sivakasi-shops-market.webp",
    headline: "Sivakasi's own shops, all in one place.",
  },
  {
    id: "straight-from-sivakasi",
    imageUrl: "/images/hero/straight-from-sivakasi-sparkler.webp",
    headline: "Straight From Sivakasi. Straight to You.",
  },
];

const TRUST_FEATURES = [
  { icon: ShieldCheck, color: "text-teal-ink bg-teal-tint", title: "Real Mill Photos", body: "Photographed at Sivakasi mills — no photocopied lists." },
  { icon: Truck, color: "text-blue-ink bg-blue-tint", title: "Direct to Your Area", body: "Delivered across Tamil Nadu at wholesale rates." },
  { icon: Tag, color: "text-maroon-ink bg-maroon-tint", title: "Wholesale Pricing", body: "Clear upfront prices, discounted straight off the printed MRP." },
  { icon: Headphones, color: "text-pink-ink bg-pink-tint", title: "Personal Confirmation", body: "We call you to confirm every item and total." },
];

import { JsonLd, buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/jsonld";

export default async function HomePage() {
  const [categories, shops, featuredCategoryGroups, crossShopProducts] = await Promise.all([
    getCategoryWithCounts(),
    getShopsForHomeRail(),
    getFeaturedCategoryGroups(),
    getCrossShopProducts({}),
  ]);
  const orgJsonLd = buildOrganizationJsonLd();
  const websiteJsonLd = buildWebSiteJsonLd();

  // Real, currently-active figures only (multi-shop spec's existing
  // discipline for getMaxActiveDiscountPercent, extended cross-shop) — never
  // a stored/stale headline number.
  const maxDiscountPercent = crossShopProducts.reduce((max, p) => Math.max(max, p.discount_percent ?? 0), 0);
  const topOffers = [...crossShopProducts]
    .filter((p) => (p.discount_percent ?? 0) > 0)
    .sort((a, b) => (b.discount_percent ?? 0) - (a.discount_percent ?? 0))
    .slice(0, 10);
  const under199 = crossShopProducts
    .filter((p) => p.price !== null && p.price < 199)
    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    .slice(0, 10);

  return (
    <div>
      <JsonLd data={orgJsonLd} />
      <JsonLd data={websiteJsonLd} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream px-4 pb-8 pt-6 text-center md:pb-12 md:pt-8">
        {/* The carousel's own slide headings are h2s (rotating, not a fixed
            page title) — this sr-only h1 keeps exactly one real page title
            in the accessibility tree/SEO structure without visually
            duplicating whichever slide happens to be showing. */}
        <h1 className="sr-only">Kolagalam — Sivakasi Crackers, Every Shop in One Place</h1>
        <div className="relative mx-auto max-w-3xl">
          <HeroBannerCarousel slides={HERO_SLIDES} />
        </div>
        <div className="relative mx-auto mt-6 max-w-3xl">
          <SparkField />
          <OrderCountdownHero />
          <div className="mt-6">
            <HomeSearchBar />
          </div>

          {(maxDiscountPercent > 0 || brandConfig.cartCharges.deliveryChargeWaiverThreshold) && (
            <div className="mx-auto mt-4 flex max-w-md gap-3">
              {maxDiscountPercent > 0 && (
                <div className="flex-1 rounded-2xl bg-gradient-festival px-4 py-3 text-left text-on-fill shadow-soft">
                  <p className="font-display text-lg font-extrabold">Upto {maxDiscountPercent}% OFF</p>
                  <p className="text-[11px] font-semibold opacity-90">across every shop</p>
                </div>
              )}
              <div className="flex-1 rounded-2xl border border-border bg-surface px-4 py-3 text-left shadow-soft">
                <p className="font-display text-lg font-extrabold text-ink">FREE Delivery</p>
                <p className="text-[11px] font-semibold text-ink-soft">
                  on orders {formatRupees(brandConfig.cartCharges.deliveryChargeWaiverThreshold)}+
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/products">
              <Button variant="secondary">
                View Products <PlayCircle size={16} aria-hidden />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Our Shops — the primary showcase, immediately below the hero
          (multi-shop spec §5.2, replaces the old Combo Packs rail; combo
          packs still exist, just inside Sri Ram's own shop page now). */}
      {shops.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-ink">கடைகள்</p>
              <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">Our Shops</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {shops.map((shop, i) => {
              // No horizontal scroll — a fixed 2-column grid at every
              // breakpoint. An odd shop count's last card spans both
              // columns and is centered at one column's width, rather
              // than stretching full-width or sitting off to one side.
              const isLastOdd = shops.length % 2 === 1 && i === shops.length - 1;
              return (
                <div key={shop.id} className={isLastOdd ? "col-span-2 flex justify-center" : ""}>
                  <div className={isLastOdd ? "w-[calc(50%-0.5rem)] min-w-[160px]" : ""}>
                    <ShopCard shop={shop} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Shop by category — links into the cross-shop category view
          (multi-shop spec §5.2, §5.5). */}
      {featuredCategoryGroups.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-ink">வகைகள்</p>
            <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">Shop by category</h2>
          </div>
          <div className="-mx-4 grid auto-cols-[5rem] grid-flow-col grid-rows-2 gap-x-3 gap-y-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
            {featuredCategoryGroups.map((group) => (
              <CategoryGroupTile key={group.id} group={group} />
            ))}
            <Link href="/products" className="flex w-20 shrink-0 flex-col items-center gap-1.5 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-secondary-bg text-xs font-semibold text-ink-soft">
                View all
              </span>
              <span className="text-xs font-medium text-ink">எல்லாம் / View all</span>
            </Link>
          </div>
        </section>
      )}

      {/* Top Offers — real, currently-active discounts across every shop
          (never fabricated). */}
      {topOffers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">🔥 Top Offers</h2>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
            {topOffers.map((p) => (
              <div key={p.id} className="w-36 shrink-0 snap-start md:w-auto">
                <ProductCard product={p} shopName={p.shop.name_en} showShopChip />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ₹199 Store — real, price-sorted, across every shop. */}
      {under199.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">₹199 Store</h2>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
            {under199.map((p) => (
              <div key={p.id} className="w-36 shrink-0 snap-start md:w-auto">
                <ProductCard product={p} shopName={p.shop.name_en} showShopChip />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trust section */}
      <section className="bg-secondary-bg px-4 py-14">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-semibold tracking-wide text-muted">WHY CHOOSE {brandConfig.brand.name.toUpperCase()}</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink md:text-3xl">
            Safe. Reliable. <span className="text-gradient-festival">Always Festive.</span>
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            {TRUST_FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col items-center gap-2">
                <span className={`flex h-14 w-14 items-center justify-center rounded-full ${f.color}`}>
                  <f.icon size={24} aria-hidden />
                </span>
                <h3 className="font-display text-sm font-semibold text-ink">{f.title}</h3>
                <p className="text-xs text-ink-soft">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* General enquiry lead form */}
      <section id="enquiry" className="scroll-mt-20 px-4 py-14">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-border bg-surface p-6 md:p-10">
          <p className="text-xs font-semibold tracking-wide text-muted">SEND AN ENQUIRY</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink md:text-3xl">
            Let&apos;s Make Your <span className="text-gradient-festival">Diwali Special</span>
          </h2>
          <p className="mt-2 max-w-md text-sm text-ink-soft">
            Fill in your details and we&apos;ll get back to you with the best offers.
          </p>
          <div className="mt-6">
            <GeneralEnquiryForm categories={categories} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-6 font-display text-xl font-semibold text-ink">How It Works</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            "Browse and add to cart",
            "Submit your enquiry (no payment)",
            "We call you within 2 hours to confirm",
            "Pay securely by UPI or bank transfer after our confirmation call",
            "Careful packing and despatch to your area",
          ].map((step, i) => (
            <li key={step} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-on-fill">
                {i + 1}
              </span>
              <p className="text-sm text-ink-soft">{step}</p>
            </li>
          ))}
        </ol>
        <Link href="/how-it-works" className="mt-4 inline-block text-sm font-semibold text-maroon-ink">
          Read the full explainer →
        </Link>
      </section>

      {/* Safety note */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="rounded-2xl border border-amber/30 bg-gold-tint p-4 text-sm text-ink-soft">
          Fireworks are explosives. Always burst them outdoors, under adult supervision.{" "}
          <Link href="/safety" className="font-semibold text-gold-ink">
            Read our full safety guidance →
          </Link>
        </div>
      </section>
    </div>
  );
}
