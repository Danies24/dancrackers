import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle, PhoneCall, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  brandConfig,
  getCanonicalUrl,
  getPhoneDisplay,
  getPhoneE164,
} from "@/config/brandConfig";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Frequently asked questions about ordering Sivakasi crackers through Kolagalam: enquiry process, payments, phone confirmation and delivery.",
  alternates: {
    canonical: getCanonicalUrl("/faq"),
  },
  openGraph: {
    title: "Frequently Asked Questions",
    description:
      "Frequently asked questions about ordering Sivakasi crackers through Kolagalam: enquiry process, payments, phone confirmation and delivery.",
    url: getCanonicalUrl("/faq"),
  },
};

interface FAQItem {
  question: string;
  answer: string;
  linkText?: string;
  linkHref?: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    question: "Why can't I just pay online directly on this site?",
    answer:
      "Under Indian court directives and the Explosives Rules, firecrackers cannot be sold through direct online checkouts. Kolagalam operates strictly as an enquiry and catalogue facilitator. You select items to generate an estimate, and all transactions and payments are handled directly with our licensed supplier over the phone.",
    linkText: "Read our full compliance notice",
    linkHref: "/compliance",
  },
  {
    question: "Is Kolagalam a direct seller or manufacturer?",
    answer:
      "No. Kolagalam is an enquiry facilitator. Our partnered licensed manufacturer in Sivakasi manufactures and sells every firecracker listed here. We simplify browsing, catalogue selection, and enquiry coordination.",
    linkText: "About our facilitator model",
    linkHref: "/about",
  },
  {
    question: "How do I submit an order enquiry?",
    answer:
      "Browse our catalogue, select your desired crackers or combo packs, and proceed to the cart. Submit your delivery address and phone number. No payment is collected on this website.",
    linkText: "See how it works step-by-step",
    linkHref: "/how-it-works",
  },
  {
    question: "When will someone call me after I send my enquiry?",
    answer:
      "Our team calls you within 2 hours during active business hours to review your list, confirm product availability, verify your delivery address, and confirm the final total.",
  },
  {
    question: "How do I pay for my crackers?",
    answer:
      "Once you confirm your enquiry with our team on the phone, payment is made directly to the licensed manufacturer's bank account via UPI or NEFT/RTGS. We never collect payments through this website.",
  },
  {
    question: "Where do you deliver across Tamil Nadu?",
    answer:
      "We coordinate deliveries across Chennai, Coimbatore, Madurai, Salem, Tiruchirappalli, and most major districts in Tamil Nadu via authorized parcel services. For other regions, availability will be verified during your confirmation call.",
  },
  {
    question: "Can I modify my cracker list after submitting?",
    answer:
      "Yes! You can easily adjust quantities, add items, or swap products when our team calls to confirm your enquiry, or by sending us a message on WhatsApp.",
  },
  {
    question: "Are the crackers genuine Sivakasi products?",
    answer:
      "Yes. Every product is sourced directly from licensed, quality-tested manufacturers in Sivakasi, Tamil Nadu, adhering to standard safety norms.",
    linkText: "Read our firecracker safety guide",
    linkHref: "/safety",
  },
];

export default function FAQPage() {
  const phoneDisplay = getPhoneDisplay();
  const phoneE164 = getPhoneE164();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold-tint text-gold-ink">
          <HelpCircle size={24} aria-hidden />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-2 text-base text-ink-soft">
          Everything you need to know about browsing, submitting enquiries, and receiving Sivakasi crackers with {brandConfig.brand.name}.
        </p>
      </div>

      {/* FAQ Accordion / List */}
      <div className="mt-10 space-y-6">
        {FAQ_LIST.map((faq, index) => (
          <article
            key={index}
            className="rounded-xl border border-border bg-surface p-5 shadow-soft transition hover:border-gold/40"
          >
            <h2 className="font-display text-lg font-semibold text-ink">
              {faq.question}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {faq.answer}
            </p>
            {faq.linkHref && faq.linkText && (
              <div className="mt-3">
                <Link
                  href={faq.linkHref}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gold-ink hover:underline"
                >
                  {faq.linkText} <ArrowRight size={13} aria-hidden />
                </Link>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Trust & Support Box */}
      <div className="mt-12 rounded-xl border border-teal/20 bg-teal-tint p-6 text-center sm:p-8">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal/20 text-teal-ink">
          <ShieldCheck size={20} aria-hidden />
        </div>
        <h3 className="mt-3 font-display text-xl font-bold text-ink">
          Have more questions?
        </h3>
        <p className="mx-auto mt-2 max-w-lg text-sm text-ink-soft">
          Our team is available to assist with pricing queries, bulk corporate enquiries, and custom Diwali orders.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href={`https://wa.me/${phoneE164}?text=Hi%20Kolagalam%2C%20I%20have%20a%20question%20about%20crackers`}>
            <Button variant="primary">
              WhatsApp Us ({phoneDisplay})
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="secondary">
              Contact Information <PhoneCall size={14} className="ml-1.5" aria-hidden />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
