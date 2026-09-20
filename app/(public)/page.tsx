import Link from "next/link";
import { ShieldCheck, Tag, Truck, Headphones, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SparkField } from "@/components/marketing/spark-field";
import { ExploreCrackers } from "@/components/marketing/explore-crackers";
import { GeneralEnquiryForm } from "@/components/marketing/general-enquiry-form";
import { OrderCountdownHero } from "@/components/marketing/order-countdown-hero";
import { ComboPackCard } from "@/components/product/combo-pack-card";
import { getCatalogue, getCategoryWithCounts, getMaxActiveDiscountPercent } from "@/lib/data";
import { rankProducts } from "@/lib/ranking";
import type { Metadata } from "next";
import { getActiveComboPacks } from "@/lib/combo-packs";
import { brandConfig, getCanonicalUrl, getPhoneDisplay, getPhoneE164 } from "@/config/brandConfig";

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

const TRUST_FEATURES = [
  { icon: ShieldCheck, color: "text-teal-ink bg-teal-tint", title: "Real Mill Photos", body: "Photographed at Sivakasi mills — no photocopied lists." },
  { icon: Truck, color: "text-blue-ink bg-blue-tint", title: "Direct to Your Area", body: "Delivered across Tamil Nadu at wholesale rates." },
  { icon: Tag, color: "text-maroon-ink bg-maroon-tint", title: "Wholesale Pricing", body: "Clear upfront prices, up to 95% off MRP." },
  { icon: Headphones, color: "text-pink-ink bg-pink-tint", title: "Personal Confirmation", body: "We call you to confirm every item and total." },
];

import { JsonLd, buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/jsonld";

export default async function HomePage() {
  const [categories, products, maxDiscountPercent, comboPacks] = await Promise.all([
    getCategoryWithCounts(),
    getCatalogue(),
    getMaxActiveDiscountPercent(),
    getActiveComboPacks(),
  ]);
  const catalogueEmpty = categories.every((c) => c.productCount === 0);
  const showcaseProducts = rankProducts(products);
  const orgJsonLd = buildOrganizationJsonLd();
  const websiteJsonLd = buildWebSiteJsonLd();

  return (
    <div>
      <JsonLd data={orgJsonLd} />
      <JsonLd data={websiteJsonLd} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream px-4 pb-8 pt-10 text-center md:pb-12 md:pt-14">
        <SparkField />
        <div className="relative mx-auto max-w-3xl">
          <span className="inline-block rounded-full border border-border bg-gold-tint px-4 py-1.5 text-xs font-semibold tracking-wide text-gold-ink shadow-soft">
            DIWALI 2026
          </span>
          <h1 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-bold leading-[1.1] text-ink md:text-5xl">
            Straight From Sivakasi. <br />
            <span className="text-gradient-festival">Straight to You.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-ink-soft md:text-lg">
            Direct from Sivakasi to your area across Tamil Nadu. Wholesale prices, no extra charges. Build your order and we&apos;ll call you to confirm.
          </p>
          <OrderCountdownHero />
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/products">
              <Button variant="secondary">
                View Products <PlayCircle size={16} aria-hidden />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Combo Packs — the primary showcase, immediately below the hero and
          above the regular category rails (§6.2 MUST). */}
      {comboPacks.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-ink">Curated for you</p>
              <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">Combo Packs</h2>
            </div>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
            {comboPacks.map((combo) => (
              <ComboPackCard key={combo.id} combo={combo} />
            ))}
          </div>
        </section>
      )}

      <>
      {catalogueEmpty ? (
        <section className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-ink-soft">
            Our catalogue is being updated. Call us on{" "}
            <a href={`tel:+${getPhoneE164()}`} className="font-semibold text-maroon-ink">
              {getPhoneDisplay()}
            </a>
            .
          </p>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted">OUR PRODUCTS</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-ink md:text-3xl">
                Explore Our <span className="text-gradient-festival">Crackers</span> Range
              </h2>
            </div>
          </div>
          <ExploreCrackers products={showcaseProducts} categories={categories} />
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
      </>
    </div>
  );
}
