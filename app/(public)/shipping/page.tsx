import type { Metadata } from "next";
import Link from "next/link";
import { PackageCheck, Truck, Clock, ShieldAlert, Phone, Mail, MapPin, CheckCircle2 } from "lucide-react";
import { brandConfig, getCanonicalUrl, getMinimumOrderValue, getPhoneDisplay, getPhoneE164, getPrimaryEmail } from "@/config/brandConfig";
import { SHOP_DELIVERY_CONFIG } from "@/config/deliveryConfig";
import { formatRupees } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description:
    "Kolagalam shipping & delivery policy: waterproof carton packing, 24–72 hr dispatch, minimum order guidelines, and lorry transport across India.",
  alternates: {
    canonical: getCanonicalUrl("/shipping"),
  },
  openGraph: {
    title: "Shipping & Delivery",
    description:
      "Kolagalam shipping & delivery policy: waterproof carton packing, 24–72 hr dispatch, minimum order guidelines, and lorry transport across India.",
    url: getCanonicalUrl("/shipping"),
  },
};

const SHIPPING_POINTS = [
  {
    en: "All materials are packed in quality waterproof cartons with special care.",
    icon: PackageCheck,
  },
  {
    en: "After your order has been confirmed on completion of payment, we will dispatch your products to the lorry shed within 24–72 hours.",
    icon: Clock,
  },
  {
    en: "We will constantly monitor each order to ensure it reaches you quickly and safely.",
    icon: Truck,
  },
  {
    // TODO(legal-review): confirm no state ever requires customer pickup —
    // previous copy said below ₹5,000, verify with ops/legal before this
    // page is treated as final.
    en: `Minimum order value is ${formatRupees(getMinimumOrderValue())} (after discount), the same across every state — no separate Tamil Nadu / other-state minimum.`,
    icon: CheckCircle2,
  },
  {
    en: `Sri Ram Crackers: packaging is free above ${formatRupees(SHOP_DELIVERY_CONFIG["sri-ram-crackers"].packaging.waiverThreshold)} and delivery is free on orders of ${formatRupees(SHOP_DELIVERY_CONFIG["sri-ram-crackers"].delivery.freeThreshold ?? 0)} and above. Below that, the packaging/delivery charges shown in your cart apply.`,
    icon: CheckCircle2,
  },
  {
    en: `Gurusamy Fireworks: wholesale factory-direct pricing, no packaging charge at all, and a flat ${formatRupees(SHOP_DELIVERY_CONFIG["gurusamy-fireworks"].delivery.flatCharge)} delivery charge on every order — this is never waived.`,
    icon: MapPin,
  },
  {
    en: "After your order is successfully placed and dispatched, the products will be delivered within 4 to 5 working days.",
    icon: Clock,
  },
  {
    en: "Delivery may take a few additional days if there are public holidays, festivals, or bandhs in between.",
    icon: ShieldAlert,
  },
];

export default function ShippingPage() {
  const email = getPrimaryEmail();
  const phone = getPhoneDisplay();
  const phoneRaw = getPhoneE164();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      {/* Header */}
      <div className="text-center">
        <span className="inline-block rounded-full border border-border bg-gold-tint px-3.5 py-1 text-xs font-semibold tracking-wide text-gold-ink">
          DISPATCH & TRANSPORT
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink md:text-4xl">Shipping & Delivery</h1>
      </div>

      {/* Main Points */}
      <div className="mt-8 space-y-4">
        {SHIPPING_POINTS.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-4 shadow-soft transition-all duration-200 hover:border-maroon-ink/40 md:p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-maroon-tint text-maroon-ink">
                <Icon size={20} aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-ink md:text-[15px] leading-relaxed">
                  {item.en}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note Box */}
      <div className="mt-6 rounded-2xl border border-amber/30 bg-gold-tint p-5 text-ink-soft">
        <h2 className="font-display text-sm font-bold text-ink">Important Note:</h2>
        <p className="mt-1.5 text-xs md:text-sm leading-relaxed">
          <strong>Note:</strong> Delivery timelines are approximate and may vary depending on transport availability, weather conditions, and unforeseen circumstances.
        </p>
      </div>

      {/* Support & Contacts Helpdesk */}
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-soft">
        <h2 className="font-display text-base font-bold text-ink md:text-lg">Customer Care & Order Desk</h2>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-border bg-cream/50 p-3">
            <span className="text-xs font-semibold text-ink-soft">Order Enquiry</span>
            <a href={`tel:+${phoneRaw}`} className="text-xs font-bold text-maroon-ink hover:underline">
              {phone}
            </a>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-cream/50 p-3">
            <span className="text-xs font-semibold text-ink-soft">Order & Payment Confirm</span>
            <a href={`tel:+${phoneRaw}`} className="text-xs font-bold text-maroon-ink hover:underline">
              {phone}
            </a>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-cream/50 p-3">
            <span className="text-xs font-semibold text-ink-soft">Despatch & Transport Confirm</span>
            <a href={`tel:+${phoneRaw}`} className="text-xs font-bold text-maroon-ink hover:underline">
              {phone}
            </a>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-cream/50 p-3">
            <span className="text-xs font-semibold text-ink-soft">Any Complaint / Support</span>
            <a href={`tel:+${phoneRaw}`} className="text-xs font-bold text-maroon-ink hover:underline">
              {phone}
            </a>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-ink-soft">
          <div className="flex items-center gap-1.5">
            <Mail size={14} className="text-maroon-ink" />
            <a href={`mailto:${email.address}`} className="font-medium text-ink hover:underline">
              {email.address}
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-maroon-ink" />
            <span>Sivakasi, Tamil Nadu</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-8 text-center">
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 h-12 text-[15px] font-semibold text-on-fill shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:glow-orange"
        >
          Browse Crackers Price List &rarr;
        </Link>
      </div>
    </div>
  );
}
