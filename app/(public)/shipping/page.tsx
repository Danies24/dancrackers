import type { Metadata } from "next";
import Link from "next/link";
import { PackageCheck, Truck, Clock, ShieldAlert, Phone, Mail, MapPin, CheckCircle2 } from "lucide-react";
import { brandConfig, getCanonicalUrl, getPhoneDisplay, getPhoneE164, getPrimaryEmail } from "@/config/brandConfig";

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
    ta: "அனைத்து பொருட்களும் உயர்தர நீர்ப்புகா (Waterproof) கார்ட்டன்களில் மிகுந்த கவனத்துடன் பேக் செய்து அனுப்பப்படும்.",
    icon: PackageCheck,
  },
  {
    en: "After your order has been confirmed on completion of payment, we will dispatch your products to the lorry shed within 24–72 hours.",
    ta: "உங்கள் கட்டணம் முழுமையாக உறுதிசெய்யப்பட்ட பிறகு, 24–72 மணி நேரத்திற்குள் உங்கள் பொருட்கள் லாரி சரக்கு நிலையத்திற்கு (Lorry Shed) அனுப்பி வைக்கப்படும்.",
    icon: Clock,
  },
  {
    en: "We will constantly monitor each order to ensure it reaches you quickly and safely.",
    ta: "உங்கள் ஆர்டர் விரைவாகவும் பாதுகாப்பாகவும் சென்றடைய, அதன் அனுப்பும் நிலையை தொடர்ந்து கண்காணிப்போம்.",
    icon: Truck,
  },
  {
    en: "Minimum purchase value within Tamil Nadu should be ₹3,000 (after discount).",
    ta: "தமிழ்நாட்டிற்குள் குறைந்தபட்ச கொள்முதல் மதிப்பு (தள்ளுபடிக்குப் பிறகு) ₹3,000 ஆக இருக்க வேண்டும்.",
    icon: CheckCircle2,
  },
  {
    en: "Minimum purchase value for other states should be ₹5,000 (after discount).",
    ta: "பிற மாநிலங்களுக்கு குறைந்தபட்ச கொள்முதல் மதிப்பு (தள்ளுபடிக்குப் பிறகு) ₹5,000 ஆக இருக்க வேண்டும்.",
    icon: CheckCircle2,
  },
  {
    en: "If the order value is below ₹5,000, the customer must collect the goods from the nearest parcel service office (after discount).",
    ta: "தள்ளுபடிக்குப் பிறகு ஆர்டர் மதிப்பு ₹5,000-க்கும் குறைவாக இருந்தால், வாடிக்கையாளர் அருகிலுள்ள பார்சல் சேவை அலுவலகத்தில் இருந்து பொருட்களை பெற்றுக்கொள்ள வேண்டும்.",
    icon: MapPin,
  },
  {
    en: "After your order is successfully placed and dispatched, the products will be delivered within 4 to 5 working days.",
    ta: "ஆர்டர் வெற்றிகரமாக பதிவு செய்யப்பட்டு அனுப்பப்பட்ட பிறகு, பொருட்கள் 4 முதல் 5 வேலை நாட்களுக்குள் டெலிவரி செய்யப்படும்.",
    icon: Clock,
  },
  {
    en: "Delivery may take a few additional days if there are public holidays, festivals, or bandhs in between.",
    ta: "அரசு விடுமுறை, பண்டிகை நாட்கள் அல்லது வேலைநிறுத்தம் (Bandh) போன்ற காரணங்களால் டெலிவரியில் கூடுதல் தாமதம் ஏற்படலாம்.",
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
        <p className="mt-2 text-sm text-ink-soft md:text-base">
          நேரடி சிவகாசி பட்டாசு டெலிவரி மற்றும் போக்குவரத்து வழிகாட்டுதல்கள்
        </p>
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
                <p lang="ta" className="text-xs text-ink-soft md:text-sm leading-relaxed">
                  {item.ta}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note Box */}
      <div className="mt-6 rounded-2xl border border-amber/30 bg-gold-tint p-5 text-ink-soft">
        <h2 className="font-display text-sm font-bold text-ink">Important Note / முக்கிய குறிப்பு:</h2>
        <p className="mt-1.5 text-xs md:text-sm leading-relaxed">
          <strong>Note:</strong> Delivery timelines are approximate and may vary depending on transport availability, weather conditions, and unforeseen circumstances.
        </p>
        <p lang="ta" className="mt-1 text-xs md:text-sm leading-relaxed">
          <strong>குறிப்பு:</strong> டெலிவரி காலம் தோராயமாகக் குறிப்பிடப்பட்டுள்ளது. போக்குவரத்து வசதி, வானிலை மற்றும் எதிர்பாராத சூழ்நிலைகள் காரணமாக டெலிவரியில் தாமதம் ஏற்படலாம்.
        </p>
      </div>

      {/* Support & Contacts Helpdesk */}
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-soft">
        <h2 className="font-display text-base font-bold text-ink md:text-lg">Customer Care & Order Desk</h2>
        <p className="mt-1 text-xs text-ink-soft">
          எங்கள் உதவி மையத்தை எந்த நேரத்திலும் தொடர்பு கொள்ளலாம்:
        </p>

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
