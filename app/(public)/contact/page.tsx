import type { Metadata } from "next";
import { Phone, Mail, MapPin } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Contact</h1>
      <p className="mt-2 text-sm text-ink-soft">We aim to respond within 2 hours during the season.</p>

      <div className="mt-6 flex flex-col gap-4">
        <ContactRow icon={<Phone size={18} />} label="Phone" value={siteConfig.operator.phoneDisplay} href={`tel:+${siteConfig.operator.phoneE164}`} />
        <ContactRow
          icon={<Phone size={18} />}
          label="WhatsApp"
          value={siteConfig.operator.phoneDisplay}
          href={`https://wa.me/${siteConfig.operator.phoneE164}`}
        />
        <ContactRow icon={<Mail size={18} />} label="Email" value={siteConfig.operator.email} href={`mailto:${siteConfig.operator.email}`} />
        <ContactRow icon={<MapPin size={18} />} label="Address" value={siteConfig.operator.address} />
      </div>

      <div className="mt-8 rounded-lg border border-border bg-surface p-4 text-sm text-ink-soft">
        <h2 className="mb-1 font-semibold text-ink">For product or warranty questions</h2>
        <p>
          {siteConfig.supplier.name} manufactures and sells every product on this site and is directly
          reachable for product quality or warranty matters. Ask us for their contact details, or we'll pass
          your question along.
        </p>
      </div>
    </div>
  );
}

function ContactRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
      <span className="text-maroon">{icon}</span>
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
