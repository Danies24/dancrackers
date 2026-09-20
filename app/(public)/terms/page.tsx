import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Phone, Mail, MapPin } from "lucide-react";
import { brandConfig, getCanonicalUrl, getPhoneDisplay, getPhoneE164, getPrimaryEmail } from "@/config/brandConfig";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms and conditions for Kolagalam crackers orders, payment confirmations, dispatch, transport, transit responsibility, and cancellation policies.",
  alternates: {
    canonical: getCanonicalUrl("/terms"),
  },
  openGraph: {
    title: "Terms & Conditions",
    description:
      "Terms and conditions for Kolagalam crackers orders, payment confirmations, dispatch, transport, transit responsibility, and cancellation policies.",
    url: getCanonicalUrl("/terms"),
  },
};

const TERMS_CLAUSES = [
  {
    num: "1",
    title: "Full Payment Confirmation Required Before Dispatch",
    en: "Goods will be dispatched only after confirmation of full payment. Payment confirmation (transaction screenshot or bank credit confirmation) is mandatory before shipment.",
    ta: "முழு தொகை பெறப்பட்டு, பணம் செலுத்தியதற்கான ஸ்கிரீன்ஷாட் அல்லது வங்கி வரவு உறுதிசெய்யப்பட்ட பிறகே பொருட்கள் அனுப்பப்படும்.",
  },
  {
    num: "2",
    title: "Transportation Charges Borne by Customer",
    en: "Transportation charges and all related expenses shall be borne by the customer unless otherwise agreed in writing.",
    ta: "போக்குவரத்து கட்டணம் மற்றும் அதனுடன் தொடர்புடைய அனைத்து செலவுகளையும் வாடிக்கையாளரே ஏற்க வேண்டும் (எழுத்துப்பூர்வமாக வேறு ஒப்பந்தம் செய்யப்பட்டிருந்தால் தவிர).",
  },
  {
    num: "3",
    title: "Transit Damage & Transporter Responsibility",
    en: "The seller shall not be held responsible for any loss or damage to the goods during transit. Any claim for transit damage must be raised directly with the transporter.",
    ta: "போக்குவரத்தின் போது ஏற்படும் சேதம், இழப்பு அல்லது குறைபாடுகளுக்கு விற்பனையாளர் பொறுப்பல்ல. இதுபோன்ற கோரிக்கைகள் சம்பந்தப்பட்ட போக்குவரத்து நிறுவனத்திடம் மட்டுமே தெரிவிக்கப்பட வேண்டும்.",
  },
  {
    num: "4",
    title: "No Returns, Exchanges, or Replacements",
    en: "Goods once sold will not be taken back, exchanged, or replaced under any circumstances.",
    ta: "விற்பனை செய்யப்பட்ட பொருட்கள் எந்த சூழ்நிலையிலும் திரும்பப் பெறப்படவோ, மாற்றப்படவோ அல்லது பதிலாக வழங்கப்படவோ மாட்டாது.",
  },
  {
    num: "5",
    title: "Payments Are Non-Refundable",
    en: "Payments once made are non-refundable under any circumstances.",
    ta: "ஒருமுறை செலுத்தப்பட்ட தொகை எந்த சூழ்நிலையிலும் திருப்பி வழங்கப்படாது.",
  },
];

export default function TermsPage() {
  const email = getPrimaryEmail();
  const phone = getPhoneDisplay();
  const phoneRaw = getPhoneE164();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      {/* Header */}
      <div className="text-center">
        <span className="inline-block rounded-full border border-border bg-gold-tint px-3.5 py-1 text-xs font-semibold tracking-wide text-gold-ink">
          LEGAL & STORE POLICIES
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink md:text-4xl">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-sm text-ink-soft md:text-base">
          விதிமுறைகள் மற்றும் நிபந்தனைகள்
        </p>
      </div>

      {/* Numbered Core Terms Clauses */}
      <div className="mt-8 space-y-4">
        {TERMS_CLAUSES.map((clause) => (
          <div
            key={clause.num}
            className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-soft transition-all duration-200 hover:border-maroon-ink/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-sm font-bold text-on-fill">
              {clause.num}
            </span>
            <div className="space-y-1.5">
              <h2 className="font-display text-sm font-bold text-ink md:text-base">
                {clause.title}
              </h2>
              <p className="text-sm font-medium text-ink md:text-[15px] leading-relaxed">
                {clause.en}
              </p>
              <p lang="ta" className="text-xs text-ink-soft md:text-sm leading-relaxed">
                {clause.ta}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Supplementary Explanations */}
      <div className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-soft md:p-8">
        <h2 className="font-display text-lg font-bold text-ink">Enquiry Process & Statutory Compliance</h2>
        
        <div className="mt-4 space-y-4 text-xs md:text-sm text-ink-soft leading-relaxed">
          <div>
            <h3 className="font-semibold text-ink">6. Enquiry Facilitation Model</h3>
            <p className="mt-1">
              Submitting a form or cart on this website creates an <strong>enquiry request</strong>, not an automatic or binding commercial sale. Our Sivakasi order desk will call you directly to verify item availability, batch dates, and transport logistics. Payment is made only after our verbal telephone confirmation.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink">7. Safety &amp; Explosives Compliance</h3>
            <p className="mt-1">
              All fireworks supplied are manufactured by licensed entities in Sivakasi following statutory safety regulations. Fireworks are explosives and must only be handled by adults or burst outdoors under strict adult supervision. Please review our{" "}
              <Link href="/safety" className="font-semibold text-maroon-ink hover:underline">
                Safety Guidance &rarr;
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Customer Care & Desk Contacts */}
      <div className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-soft md:p-8">
        <h2 className="font-display text-lg font-bold text-ink">Contact &amp; Clarifications</h2>
        <p className="mt-1 text-xs text-ink-soft">
          விதிமுறைகள் பற்றிய சந்தேகங்களுக்கு எங்கள் குழுவை தொடர்பு கொள்ளவும்:
        </p>

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
    </div>
  );
}
