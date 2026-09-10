import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck, Tag, Truck, Headphones, ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SparkField } from "@/components/marketing/spark-field";
import { ExploreCrackers } from "@/components/marketing/explore-crackers";
import { GeneralEnquiryForm } from "@/components/marketing/general-enquiry-form";
import { getCatalogue, getCategoryWithCounts } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Dan Crackers — Sivakasi Crackers for Chennai | Order Online",
};

export const revalidate = 300;

const TRUST_INDICATORS = [
  "Wide Range of Products",
  "Best Wholesale Prices",
  "Trusted & Reliable",
  "Pan India Supply",
];

const TRUST_FEATURES = [
  { icon: ShieldCheck, color: "text-teal-ink bg-teal-tint", title: "Quality Assured", body: "Premium and tested products." },
  { icon: Tag, color: "text-maroon-ink bg-maroon-tint", title: "Competitive Pricing", body: "Best rates for bulk orders." },
  { icon: Truck, color: "text-blue-ink bg-blue-tint", title: "Pan India Delivery", body: "We deliver across India." },
  { icon: Headphones, color: "text-pink-ink bg-pink-tint", title: "Dedicated Support", body: "Always here to help." },
];

export default async function HomePage() {
  const [categories, products] = await Promise.all([getCategoryWithCounts(), getCatalogue()]);
  const catalogueEmpty = categories.every((c) => c.productCount === 0);
  const showcaseProducts = [...products].sort((a, b) => Number(b.is_bestseller) - Number(a.is_bestseller));

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream px-4 pb-14 pt-16 text-center md:pb-20 md:pt-24">
        <SparkField />
        <div className="relative mx-auto max-w-3xl">
          <span className="inline-block rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold tracking-wide text-gold">
            DIWALI 2026
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-6xl">
            Celebrate <br />
            <span className="text-gradient-festival">Brighter Together</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base text-ink-soft md:text-lg">
            Premium crackers. Safer celebrations. Happier moments. Supplied by {siteConfig.supplier.name}, Sivakasi.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#enquiry">
              <Button size="default">
                Send Enquiry <ArrowRight size={16} aria-hidden />
              </Button>
            </a>
            <Link href="/products">
              <Button variant="secondary">
                View Products <PlayCircle size={16} aria-hidden />
              </Button>
            </Link>
          </div>
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {TRUST_INDICATORS.map((t) => (
              <div key={t} className="rounded-2xl border border-border bg-surface/60 px-3 py-3 text-xs font-medium text-ink-soft">
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="zone-light">
      {catalogueEmpty ? (
        <section className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-ink-soft">
            Our catalogue is being updated. Call us on{" "}
            <a href={`tel:+${siteConfig.operator.phoneE164}`} className="font-semibold text-maroon-ink">
              {siteConfig.operator.phoneDisplay}
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
          <p className="text-xs font-semibold tracking-wide text-muted">WHY CHOOSE DAN CRACKERS</p>
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
            "You pay the supplier directly",
            "The supplier despatches to your address",
          ].map((step, i) => (
            <li key={step} className="rounded-2xl border border-border bg-surface p-4">
              <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-on-fill">
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
    </div>
  );
}
