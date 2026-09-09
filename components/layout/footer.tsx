import Link from "next/link";
import { complianceNotice, manufacturerFacilitatorNotice, siteConfig } from "@/lib/site-config";
import type { CategoryRow } from "@/lib/data";

/**
 * §10.3, §32.5. The manufacturer/facilitator wording and the compliance
 * notice appear here on every page — this is not optional decoration, it's
 * the legal footing the whole business model depends on (§32.4).
 */
export function Footer({ topCategories = [] }: { topCategories?: CategoryRow[] }) {
  return (
    <footer className="mt-16 border-t border-border bg-cream">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-10 md:grid-cols-4">
        <div className="min-w-0">
          <h3 className="mb-3 font-display text-base font-semibold text-maroon">
            {siteConfig.name}
          </h3>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
            <li>
              <Link href="/how-it-works">How it works</Link>
            </li>
          </ul>
        </div>
        <div className="min-w-0">
          <h3 className="mb-3 font-display text-base font-semibold text-maroon">Products</h3>
          <ul className="space-y-2 text-sm text-ink-soft">
            {topCategories.slice(0, 6).map((cat) => (
              <li key={cat.id}>
                <Link href={`/products/${cat.slug}`}>{cat.name_en}</Link>
              </li>
            ))}
            {topCategories.length === 0 && (
              <li>
                <Link href="/products">All Products</Link>
              </li>
            )}
          </ul>
        </div>
        <div className="min-w-0">
          <h3 className="mb-3 font-display text-base font-semibold text-maroon">Information</h3>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li>
              <Link href="/safety">Safety</Link>
            </li>
            <li>
              <Link href="/faq">FAQ</Link>
            </li>
            <li>
              <Link href="/terms">Terms</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
            <li>
              <Link href="/compliance">Compliance</Link>
            </li>
          </ul>
        </div>
        <div className="min-w-0">
          <h3 className="mb-3 font-display text-base font-semibold text-maroon">Contact</h3>
          <ul className="space-y-2 break-words text-sm text-ink-soft">
            <li>
              <a href={`tel:+${siteConfig.operator.phoneE164}`}>{siteConfig.operator.phoneDisplay}</a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.operator.email}`} className="break-all">
                {siteConfig.operator.email}
              </a>
            </li>
            <li>{siteConfig.operator.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border bg-maroon-tint px-4 py-4 text-center text-xs leading-relaxed text-ink-soft">
        <p>{manufacturerFacilitatorNotice.manufacturedBy}</p>
        <p>{manufacturerFacilitatorNotice.facilitatedBy}</p>
        <p className="mx-auto mt-2 max-w-2xl">{complianceNotice}</p>
      </div>
    </footer>
  );
}
