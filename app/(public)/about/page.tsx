import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Store, Award, Truck, ShieldCheck, Phone, Mail, MapPin } from "lucide-react";
import { brandConfig, getCanonicalUrl, getPhoneDisplay, getPhoneE164, getPrimaryEmail } from "@/config/brandConfig";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Kolagalam crackers online store — Sivakasi fireworks wholesaler since 2020, now in 2026 expanding to online customers across Tamil Nadu and all of India.",
  alternates: {
    canonical: getCanonicalUrl("/about"),
  },
  openGraph: {
    title: `About ${brandConfig.brand.name}`,
    description:
      "Kolagalam crackers online store — Sivakasi fireworks wholesaler since 2020, now in 2026 expanding to online customers across Tamil Nadu and all of India.",
    url: getCanonicalUrl("/about"),
  },
};

const HIGHLIGHTS = [
  {
    title: "Since 2020",
    desc: "Established fireworks wholesaler with our shop in Sivakasi since 2020, now expanding online in 2026.",
    icon: Award,
  },
  {
    title: "Own Shop in Sivakasi",
    desc: "Direct physical presence close to the mills, guaranteeing genuine quality and factory-direct rates.",
    icon: Store,
  },
  {
    title: "Serving All Over India",
    desc: "Proud to have lit up millions of lives and festive celebrations across Tamil Nadu and nationwide.",
    icon: Sparkles,
  },
  {
    title: "Waterproof Dispatch",
    desc: "Packed with care in waterproof cartons and dispatched quickly through trusted lorry logistics.",
    icon: Truck,
  },
];

export default function AboutPage() {
  const email = getPrimaryEmail();
  const phone = getPhoneDisplay();
  const phoneRaw = getPhoneE164();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      {/* Header Badge & Title */}
      <div className="text-center">
        <span className="inline-block rounded-full border border-border bg-gold-tint px-3.5 py-1 text-xs font-semibold tracking-wide text-gold-ink">
          SINCE 2020 &bull; SIVAKASI, TAMIL NADU
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink md:text-4xl">
          About <span className="text-gradient-festival">Kolagalam</span>
        </h1>
        <p className="mt-2 text-sm text-ink-soft md:text-base">
          நேரடி சிவகாசி பட்டாசு மொத்த விற்பனை மற்றும் இணைய சேவை
        </p>
      </div>

      {/* Main Story Box: About Company */}
      <div className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-soft md:p-8">
        <h2 className="font-display text-xl font-bold text-ink md:text-2xl">About Company</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-soft md:text-[15px]">
          <p className="rounded-2xl border border-maroon-ink/10 bg-maroon-tint/40 p-4 font-medium text-ink">
            We are &quot;Kolagalam&quot; crackers online store, wholesaler of fireworks and crackers owning a shop in Sivakasi, Tamilnadu. We are into this business since 2020 and has been successfully running our company with selling crackers in all over india. Since the day of our initiation, we have anticipated largely in making millions of lives happier and lightened up. We feel extremely proud of ourselves for being the very first online retail store to sell crackers.
          </p>

          <h3 className="pt-2 font-display text-base font-semibold text-ink">
            Now in 2026: Expanding to Online Customers
          </h3>
          <p>
            Rooted in our wholesale shop in Sivakasi established in 2020, now in 2026 we are expanding directly to online customers. Through Kolagalam, families across Tamil Nadu and all of India can now explore authentic Sivakasi crackers straight from the manufacturing hub — without middleman markups, travel hassles, or photocopied price lists.
          </p>
          <p>
            We personally visit the mills in Sivakasi to photograph every genuine product and inspect packaging quality. When you place an enquiry, our dedicated team calls you personally to verify every single item and confirm your total. After your payment is completed securely, we carefully pack your crackers in waterproof cartons and dispatch them directly to your nearest transport hub.
          </p>
        </div>
      </div>

      {/* 4 Highlight Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {HIGHLIGHTS.map((h, i) => {
          const Icon = h.icon;
          return (
            <div key={i} className="flex gap-4 rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-tint text-gold-ink">
                <Icon size={22} aria-hidden />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-ink">{h.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{h.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Why Families Order With Us */}
      <div className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-soft md:p-8">
        <h2 className="font-display text-lg font-bold text-ink md:text-xl">Why Families Order With Kolagalam</h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {brandConfig.about.whyUs.map((point, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-ink-soft">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-maroon-ink" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Support & Contact Details */}
      <div className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-soft md:p-8">
        <h2 className="font-display text-lg font-bold text-ink">Customer Care & Enquiry Desk</h2>
        <p className="mt-1 text-xs text-ink-soft">
          எங்களை நேரடியாக அழைக்க அல்லது வாட்ஸ்அப் மூலம் தொடர்புகொள்ள:
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-border bg-cream/50 p-3.5">
            <span className="text-xs font-semibold text-ink-soft">Order Enquiry</span>
            <a href={`tel:+${phoneRaw}`} className="text-xs font-bold text-maroon-ink hover:underline">
              {phone}
            </a>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-cream/50 p-3.5">
            <span className="text-xs font-semibold text-ink-soft">Order & Payment Confirm</span>
            <a href={`tel:+${phoneRaw}`} className="text-xs font-bold text-maroon-ink hover:underline">
              {phone}
            </a>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-cream/50 p-3.5">
            <span className="text-xs font-semibold text-ink-soft">Despatch & Transport Confirm</span>
            <a href={`tel:+${phoneRaw}`} className="text-xs font-bold text-maroon-ink hover:underline">
              {phone}
            </a>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-cream/50 p-3.5">
            <span className="text-xs font-semibold text-ink-soft">Customer Support</span>
            <a href={`tel:+${phoneRaw}`} className="text-xs font-bold text-maroon-ink hover:underline">
              {phone}
            </a>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-ink-soft">
          <div className="flex items-center gap-1.5">
            <Mail size={15} className="text-maroon-ink" />
            <a href={`mailto:${email.address}`} className="font-medium text-ink hover:underline">
              {email.address}
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone size={15} className="text-maroon-ink" />
            <a href={`tel:+${phoneRaw}`} className="font-medium text-ink hover:underline">
              +91 {phone}
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={15} className="text-maroon-ink" />
            <span>Sivakasi, Tamil Nadu</span>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-8 text-center">
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 h-12 text-[15px] font-semibold text-on-fill shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:glow-orange"
        >
          Explore Our Crackers Range &rarr;
        </Link>
      </div>
    </div>
  );
}
