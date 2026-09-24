import Link from "next/link";
import { ShieldCheck, Tag, Truck, Headphones } from "lucide-react";
import { SparkField } from "@/components/marketing/spark-field";
import { GeneralEnquiryForm } from "@/components/marketing/general-enquiry-form";
import { OrderCountdownHero } from "@/components/marketing/order-countdown-hero";
import { HomeSearchBar } from "@/components/marketing/home-search-bar";
import { HeroBannerCarousel, type HeroBannerSlide } from "@/components/marketing/hero-banner-carousel";
import { ShopShowcaseCard } from "@/components/shop/shop-showcase-card";
import { CategoryGroupTile } from "@/components/shop/category-group-tile";
import { ProductCard } from "@/components/product/product-card";
import { ComboPackCard } from "@/components/product/combo-pack-card";
import { getCategoryWithCounts } from "@/lib/data";
import { getShopsForHomeShowcase } from "@/lib/shops";
import { getAllCategoryGroups, getCategoryGroupIdByCategoryId, type CategoryGroupRow } from "@/lib/category-groups";
import { getCrossShopProducts } from "@/lib/cross-shop";
import { getActiveComboPacks } from "@/lib/combo-packs";
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

const NIGHT_PINNED_SLUGS = ["sparklers", "ground-chakkars", "flower-pots"];
const DAY_PINNED_SLUGS = ["paper-bombs", "bombs", "sound-crackers"];

/** Pins the given slugs first (in that order), then the rest by cross-shop
 * product count descending, capped at 10 — the user's explicit ordering
 * rule for the home Night/Day Crackers tiles. */
function orderCategoryGroups(groups: CategoryGroupRow[], pinnedSlugs: string[], countByGroupId: Map<string, number>): CategoryGroupRow[] {
  const bySlug = new Map(groups.map((g) => [g.slug, g]));
  const pinned = pinnedSlugs.map((slug) => bySlug.get(slug)).filter((g): g is CategoryGroupRow => !!g);
  const pinnedIds = new Set(pinned.map((g) => g.id));
  const rest = groups
    .filter((g) => !pinnedIds.has(g.id))
    .sort((a, b) => (countByGroupId.get(b.id) ?? 0) - (countByGroupId.get(a.id) ?? 0));
  return [...pinned, ...rest].slice(0, 10);
}

export default async function HomePage() {
  const [categories, shopCards, allCategoryGroups, categoryIdToGroupId, crossShopProducts, comboPacks] = await Promise.all([
    getCategoryWithCounts(),
    getShopsForHomeShowcase(),
    getAllCategoryGroups(),
    getCategoryGroupIdByCategoryId(),
    getCrossShopProducts({}),
    getActiveComboPacks(),
  ]);
  // Shop by category, segregated by when a cracker is conventionally used
  // (20260924000004/5) — a real category_group tagged night/day, never the
  // two virtual "collects_time_of_day" rows themselves (their own
  // time_of_day is null, so they're naturally excluded here). Sparklers/
  // Ground Chakkars/Flower Pots and Paper Bombs/Bombs/Sound Crackers are
  // pinned first per the user's ask, the rest ranked by cross-shop count.
  const countByGroupId = new Map<string, number>();
  for (const p of crossShopProducts) {
    const groupId = categoryIdToGroupId.get(p.category.id);
    if (!groupId) continue;
    countByGroupId.set(groupId, (countByGroupId.get(groupId) ?? 0) + 1);
  }
  const nightCategoryGroups = orderCategoryGroups(
    allCategoryGroups.filter((g) => g.time_of_day === "night"),
    NIGHT_PINNED_SLUGS,
    countByGroupId,
  );
  const dayCategoryGroups = orderCategoryGroups(
    allCategoryGroups.filter((g) => g.time_of_day === "day"),
    DAY_PINNED_SLUGS,
    countByGroupId,
  );
  const orgJsonLd = buildOrganizationJsonLd();
  const websiteJsonLd = buildWebSiteJsonLd();

  // Real, currently-active figures only (multi-shop spec's existing
  // discipline for getMaxActiveDiscountPercent, extended cross-shop) — never
  // a stored/stale headline number.
  const maxDiscountPercent = crossShopProducts.reduce((max, p) => Math.max(max, p.discount_percent ?? 0), 0);
  const under199 = crossShopProducts
    .filter((p) => p.price !== null && p.price < 199)
    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    .slice(0, 10);

  return (
    <div>
      <JsonLd data={orgJsonLd} />
      <JsonLd data={websiteJsonLd} />

      {/* Search + the two headline offer tiles — the page's first visible
          section below the global nav, per the confirmed home layout. */}
      <section className="relative overflow-hidden bg-cream px-4 pb-6 pt-8 text-center">
        <SparkField />
        <div className="relative mx-auto max-w-md">
          <HomeSearchBar />

          {(maxDiscountPercent > 0 || brandConfig.cartCharges.deliveryChargeWaiverThreshold) && (
            <div className="mt-4 flex gap-3">
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
        </div>
      </section>

      {/* The quote — replaces the old "View Products" CTA button. The
          page's one real, always-visible h1 (not the rotating carousel
          below, which is supplementary and moved further down the page). */}
      <section className="px-4 pb-6 pt-6 text-center">
        <h1 className="mx-auto max-w-xl font-display text-2xl font-bold leading-[1.15] text-ink md:text-4xl">
          Straight From Sivakasi. <span className="text-gradient-festival">Straight to You.</span>
        </h1>
        <div className="mx-auto mt-4 max-w-xl">
          <OrderCountdownHero />
        </div>
      </section>

      {/* Shop by category — segregated into Night/Day Crackers (20260924000004/5),
          each a 4-column grid, no horizontal scroll. "Night Crackers"/"Day
          Crackers" are plain section titles, not links — they're not a
          browsable category themselves, just a grouping for the tiles below. */}
      {(nightCategoryGroups.length > 0 || dayCategoryGroups.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-ink">வகைகள்</p>
            <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">Shop by category</h2>
          </div>

          {nightCategoryGroups.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 font-display text-base font-bold text-ink">🌙 Night Crackers</h3>
              <div className="grid grid-cols-4 gap-x-3 gap-y-5">
                {nightCategoryGroups.map((group) => (
                  <CategoryGroupTile key={group.id} group={group} />
                ))}
              </div>
            </div>
          )}

          {dayCategoryGroups.length > 0 && (
            <div>
              <h3 className="mb-4 font-display text-base font-bold text-ink">☀️ Day Crackers</h3>
              <div className="grid grid-cols-4 gap-x-3 gap-y-5">
                {dayCategoryGroups.map((group) => (
                  <CategoryGroupTile key={group.id} group={group} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Our Shops — Gurusamy, then Sri Ram, then any others
          (lib/shops.ts's getShopsForHomeShowcase), each card showing its
          own top 5 products, the whole card tapping through to that shop. */}
      {shopCards.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-ink">கடைகள்</p>
            <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">Our Shops</h2>
          </div>
          <div className="flex flex-col gap-4">
            {shopCards.map((card) => (
              <ShopShowcaseCard key={card.shop.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {/* Hero banner carousel — moved below the shops showcase per the
          confirmed home layout (was the page's top section). */}
      <section className="px-4 pb-10">
        <div className="mx-auto max-w-3xl">
          <HeroBannerCarousel slides={HERO_SLIDES} />
        </div>
      </section>

      {/* Combo Packs — Sri Ram's premium-showcase treatment (ComboPackCard),
          replacing the old cross-shop "Top Offers" carousel with a
          highlighted spotlight on the one shop that actually has them. */}
      {comboPacks.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">🎁 Combo Packs</h2>
            <p className="text-xs font-semibold text-ink-soft">From Sri Ram Crackers</p>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
            {comboPacks.map((combo) => (
              <div key={combo.id} className="w-64 shrink-0 snap-start md:w-auto">
                <ComboPackCard combo={combo} />
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
