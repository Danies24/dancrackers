import type { Metadata } from "next";
import { Phone, Mail, MapPin } from "lucide-react";
import { brandConfig, getFormattedAddress, getPhoneDisplay, getPhoneE164, getPrimaryEmail, getPrimarySupplier } from "@/config/brandConfig";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  const email = getPrimaryEmail();
  const supplier = getPrimarySupplier();
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
        <ContactRow icon={<MapPin size={18} />} label="Address" value={getFormattedAddress()} />
      </div>

      <div className="mt-8 rounded-lg border border-border bg-surface p-4 text-sm text-ink-soft">
        <h2 className="mb-1 font-semibold text-ink">For product or warranty questions</h2>
        <p>
          {supplier.name || "Our supplier"} manufactures and sells every product on this site and is directly
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
