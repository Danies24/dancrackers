import type { Metadata } from "next";
import { brandConfig, getPrimarySupplier } from "@/config/brandConfig";

export const metadata: Metadata = { title: `About ${brandConfig.brand.name}` };

export default function AboutPage() {
  const supplier = getPrimarySupplier();
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

        <p>
          We are not the manufacturer or seller of the fireworks on this site.{" "}
          <strong>{supplier.name || "Our supplier"}</strong> manufactures and sells every product here, and
          holds the licences required to do so. We facilitate your order — building a clear, priced catalogue,
          collecting your enquiry, and connecting you with the supplier so you can confirm and pay them
          directly.
        </p>

        {brandConfig.about.story.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}

        <p>
          For product quality, warranty or manufacturing questions, the supplier is directly reachable — see
          our <a href="/contact" className="font-semibold text-maroon-ink">Contact</a> page.
        </p>
      </div>

      {brandConfig.about.whyUs.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Why choose us</h2>
          <ul className="flex flex-col gap-2 text-sm text-ink-soft">
            {brandConfig.about.whyUs.map((point, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-maroon-ink">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
