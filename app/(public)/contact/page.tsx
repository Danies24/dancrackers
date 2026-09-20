import type { Metadata } from "next";
import { Phone, Mail } from "lucide-react";
import {
  brandConfig,
  getCanonicalUrl,
  getPhoneDisplay,
  getPhoneE164,
  getPrimaryEmail,
} from "@/config/brandConfig";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Kolagalam for Sivakasi crackers enquiries. Call, WhatsApp, or reach us directly for Diwali 2026 bookings and support.",
  alternates: {
    canonical: getCanonicalUrl("/contact"),
  },
  openGraph: {
    title: "Contact Us",
    description:
      "Contact Kolagalam for Sivakasi crackers enquiries. Call, WhatsApp, or reach us directly for Diwali 2026 bookings and support.",
    url: getCanonicalUrl("/contact"),
  },
};

export default function ContactPage() {
  const email = getPrimaryEmail();
  const phoneDisplay = getPhoneDisplay();
  const phoneE164 = getPhoneE164();

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Contact</h1>
      <p className="mt-2 text-sm text-ink-soft">{brandConfig.contact.responseTimeText}.</p>

      <div className="mt-6 flex flex-col gap-4">
        <ContactRow icon={<Phone size={18} />} label="Phone" value={phoneDisplay} href={`tel:+${phoneE164}`} />
        <ContactRow icon={<Phone size={18} />} label="WhatsApp" value={phoneDisplay} href={`https://wa.me/${phoneE164}`} />
        <ContactRow icon={<Mail size={18} />} label="Email" value={email.address} href={`mailto:${email.address}`} />
      </div>
    </div>
  );
}

function ContactRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
      <span className="text-maroon-ink">{icon}</span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-medium text-ink">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener">
      {content}
    </a>
  ) : (
    content
  );
}
