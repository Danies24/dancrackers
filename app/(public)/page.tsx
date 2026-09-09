import Link from "next/link";
import type { Metadata } from "next";
import { ProductRail } from "@/components/product/product-rail";
import { Button } from "@/components/ui/button";
import { getBestsellers, getCategoryWithCounts, getFeatured } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Dan Crackers — Sivakasi Crackers for Chennai | Order Online",
};

export const revalidate = 300;

export default async function HomePage() {
  const [categories, bestsellers, featured] = await Promise.all([
    getCategoryWithCounts(),
    getBestsellers(),
    getFeatured(),
  ]);

  const giftBoxCategory = categories.find((c) => c.slug === "gift-box");
  const giftBoxRailProducts = featured.filter((p) => p.category?.slug === "gift-box");
  const catalogueEmpty = categories.every((c) => c.productCount === 0);

  return (
    <div>
      {/* 1. Hero */}
      <section className="bg-gradient-to-b from-maroon-tint to-cream px-4 py-12 text-center md:py-20">
        <h1 className="mx-auto max-w-2xl font-display text-3xl font-semibold text-ink md:text-5xl">
          {siteConfig.tagline}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">
          Browse the full price list, build your order, and we will call you to confirm. Supplied
          by {siteConfig.supplier.name}, Sivakasi.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/products">
            <Button size="default">Browse Crackers →</Button>
          </Link>
          <Link href="/how-it-works">
            <Button variant="secondary">How ordering works</Button>
          </Link>
        </div>
      </section>

      {/* 2. Trust strip */}
      <section className="border-y border-border bg-surface">
        <div className="scrollbar-none mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-4 text-sm text-ink-soft">
          {[
            "Direct from licensed Sivakasi mills",
            "Every price on the site, no hidden rates",
            "A real person calls you within 2 hours",
            "Pay the supplier directly — never to us",
          ].map((t) => (
            <span key={t} className="shrink-0 whitespace-nowrap">
              {t}
            </span>
          ))}
        </div>
      </section>

      {catalogueEmpty ? (
        <section className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-ink-soft">
            Our catalogue is being updated. Call us on{" "}
            <a href={`tel:+${siteConfig.operator.phoneE164}`} className="font-semibold text-maroon">
              {siteConfig.operator.phoneDisplay}
            </a>
            .
          </p>
        </section>
      ) : (
        <>
          {/* 3. Shop by category */}
          <section className="mx-auto max-w-6xl px-4 py-10">
            <h2 className="mb-4 font-display text-xl font-semibold text-ink">Shop by Category</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products/${cat.slug}`}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-4 text-center hover:border-maroon"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-maroon-tint font-display text-xl font-semibold text-maroon">
                    {cat.name_en.charAt(0)}
                  </span>
                  <span className="text-sm font-medium text-ink">{cat.name_en}</span>
                  <span className="text-xs text-muted">{cat.productCount} items</span>
                </Link>
              ))}
            </div>
          </section>

          {/* 4. Gift boxes & combos */}
          {giftBoxRailProducts.length >= 3 && (
            <section className="mx-auto max-w-6xl px-4 py-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-ink">Gift Boxes & Combos</h2>
                {giftBoxCategory && (
                  <Link href={`/products/${giftBoxCategory.slug}`} className="text-sm font-medium text-maroon">
                    See all →
                  </Link>
                )}
              </div>
              <ProductRail products={giftBoxRailProducts} />
            </section>
          )}

          {/* 5. Popular this season */}
          {bestsellers.length >= 3 && (
            <section className="mx-auto max-w-6xl px-4 py-6">
              <h2 className="mb-4 font-display text-xl font-semibold text-ink">Popular This Season</h2>
              <ProductRail products={bestsellers} />
            </section>
          )}
        </>
      )}

      {/* 6. How it works */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-6 font-display text-xl font-semibold text-ink">How It Works</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            "Browse and add to cart",
            "Submit your enquiry (no payment)",
            "We call you within 2 hours to confirm",
            "You pay the supplier directly",
            "The supplier despatches to your address",
          ].map((step, i) => (
            <li key={step} className="rounded-lg border border-border bg-surface p-4">
              <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-maroon text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="text-sm text-ink-soft">{step}</p>
            </li>
          ))}
        </ol>
        <Link href="/how-it-works" className="mt-4 inline-block text-sm font-semibold text-maroon">
          Read the full explainer →
        </Link>
      </section>

      {/* 7. Why order through us */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: "Transparent pricing", body: "Every rate is on the site — no hidden costs, no arithmetic." },
            { title: "Human confirmation", body: "A real person calls to confirm your order before anything is charged." },
            { title: "Local to Sivakasi", body: "We visit the mill ourselves — the products and prices are real." },
          ].map((b) => (
            <div key={b.title}>
              <h3 className="mb-1 font-display text-base font-semibold text-ink">{b.title}</h3>
              <p className="text-sm text-ink-soft">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Safety note */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-lg border border-amber/30 bg-gold-tint p-4 text-sm text-ink-soft">
          Fireworks are explosives. Always burst them outdoors, under adult supervision.{" "}
          <Link href="/safety" className="font-semibold text-maroon">
            Read our full safety guidance →
          </Link>
        </div>
      </section>
    </div>
  );
}
