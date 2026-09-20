import type { Metadata } from "next";
import Link from "next/link";
import { brandConfig, getCanonicalUrl } from "@/config/brandConfig";

export const metadata: Metadata = {
  title: `About ${brandConfig.brand.name}`,
  description:
    "Learn about Kolagalam — crackers direct from Sivakasi to your area across Tamil Nadu. Honest wholesale prices, real photos, personal order confirmation.",
  alternates: {
    canonical: getCanonicalUrl("/about"),
  },
  openGraph: {
    title: `About ${brandConfig.brand.name}`,
    description:
      "Learn about Kolagalam — crackers direct from Sivakasi to your area across Tamil Nadu. Honest wholesale prices, real photos, personal order confirmation.",
    url: getCanonicalUrl("/about"),
  },
};

export default function AboutPage() {
  const team = brandConfig.team.filter((member) => member.showOnAboutPage);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink">{brandConfig.about.headline}</h1>

      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-ink-soft">
        {team.length > 0 && (
          <p>
            {brandConfig.brand.name} is run by {team.map((m) => m.name).join(" and ")}.{" "}
            {team.map((m) => `${m.name} ${m.bio}`).join(" ")}
          </p>
        )}

        {brandConfig.about.story.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Why families order with us</h2>
        <ul className="flex flex-col gap-2.5 text-sm text-ink-soft">
          {brandConfig.about.whyUs.map((point, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-maroon-ink">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 h-12 text-[15px] font-semibold text-on-fill shadow-sm hover:-translate-y-0.5 hover:glow-orange transition-all duration-200"
        >
          Browse Crackers &rarr;
        </Link>
      </div>
    </div>
  );
}
