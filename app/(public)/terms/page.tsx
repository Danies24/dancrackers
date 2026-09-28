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
    // TODO(legal-review): confirm this wording still reflects the actual
    // delivery-charge/free-delivery policy before relying on it — it now
    // depends on config/deliveryConfig.ts rather than a flat customer-pays rule.
    num: "2",
    title: "Delivery Charges As Shown In Your Cart",
    en: "Delivery charges, if any, are exactly what is shown in your cart at the time of your enquiry, and confirmed again on our call. Free delivery only applies where a shop states it and your order value qualifies — it is not offered by every shop on this site.",
    ta: "டெலிவரி கட்டணம் (இருந்தால்) உங்கள் விசாரணையின் போது கார்ட்டில் காட்டப்படும் தொகையே — எங்கள் அழைப்பின் போது மீண்டும் உறுதி செய்யப்படும். இலவச டெலிவரி, அந்தக் கடை அதைக் குறிப்பிட்டு, உங்கள் ஆர்டர் மதிப்பு தகுதி பெற்றால் மட்டுமே பொருந்தும் — இது எல்லா கடைகளுக்கும் இல்லை.",
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

          <div>
            <h3 className="font-semibold text-ink">8. Shared Cart Links</h3>
            <p className="mt-1">
              A cart link shared by another customer is only a list of items and quantities — it carries no price, no availability guarantee, and no personal data. Prices, stock and any applicable delivery charge are always recalculated from our live catalogue when the link is opened, and confirmed again by phone before any order is placed.
            </p>
          </div>

          {/* TODO(legal-review): confirm this price/stock-change wording before relying on it. */}
          <div>
            <h3 className="font-semibold text-ink">9. Prices &amp; Stock May Change Before Confirmation</h3>
            <p className="mt-1">
              Prices, stock availability and applicable charges shown while browsing or in an enquiry can change before our confirmation call — the amount confirmed on that call, not any earlier figure, is what you pay.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-ink">10. When An Order Is Confirmed</h3>
            <p className="mt-1">
              No order is confirmed by submitting an enquiry or a cart alone. An order is confirmed only after our team has called you to verify the items and total, and payment has been received as described above.
            </p>
          </div>

          {/* TODO(legal-review): confirm this facilitator/seller-of-record wording with counsel. */}
          <div>
            <h3 className="font-semibold text-ink">11. Kolagalam Is A Facilitator, Not The Seller</h3>
            <p className="mt-1">
              Kolagalam facilitates enquiries and connects you with a licensed fireworks manufacturer/seller — it is not itself the seller of record. Where applicable, the licensed seller is named on your invoice. See our{" "}
              <Link href="/compliance" className="font-semibold text-maroon-ink hover:underline">
                Compliance Notice &rarr;
              </Link>{" "}
              for the full legal position.
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
