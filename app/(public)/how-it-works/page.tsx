import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { brandConfig, getPrimarySupplier } from "@/config/brandConfig";

export const metadata: Metadata = {
  title: `How to Order Crackers from ${brandConfig.brand.name}`,
};

const supplier = getPrimarySupplier();

const steps = [
  { title: "Browse and add to cart", body: "Search or browse by category. Every price is on the site." },
  { title: "Submit your enquiry (no payment)", body: "Tell us your name, phone and address. No payment field exists anywhere on this site." },
  { title: "We call you within 2 hours to confirm", body: "Our team calls to confirm your items, address and the final amount." },
  { title: "You pay the supplier directly", body: "By UPI or bank transfer, straight to the supplier — never to us." },
  { title: "The supplier despatches to your address", body: `${supplier.name || "The supplier"} packs and sends your order.` },
];

const faqs = [
  {
    q: "Why can't I just pay online here?",
    a: "Indian courts have directed that firecrackers cannot be sold through online checkouts. This site takes enquiries only — the actual sale and payment happen directly with the supplier, by phone.",
  },
  {
    q: "Is this a scam?",
    a: "No. We are a booking facilitator for a licensed Sivakasi manufacturer. We never take your money — you pay the supplier directly, after a phone call confirms your order.",
  },
  {
    q: "When will I get a call?",
    a: "Within 2 hours of submitting your enquiry, during business hours.",
  },
  {
    q: "Can I change my order after submitting?",
    a: "Yes — tell us on the confirmation call, or reach us on WhatsApp any time before that.",
  },
  {
    q: "What if I'm outside Chennai?",
    a: "We mainly deliver around Chennai. If your pincode is outside our usual area, we'll confirm whether we can reach you when we call.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink">How It Works</h1>

      <ol className="mt-6 flex flex-col gap-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-lg border border-border bg-surface p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-maroon text-sm font-bold text-white">
              {i + 1}
            </span>
            <div>
              <h2 className="font-semibold text-ink">{step.title}</h2>
              <p className="text-sm text-ink-soft">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-lg border border-amber/30 bg-gold-tint p-4 text-sm text-ink-soft">
        <h2 className="mb-1 font-semibold text-ink">Why is there no "Buy Now" button?</h2>
        <p>
          Online sale of firecrackers is not permitted under Indian law (Supreme Court order in{" "}
          <em>Arjun Gopal v. Union of India</em>, 2018). This website collects enquiries only — the sale itself
          happens between you and the supplier, after a phone call. See our{" "}
          <Link href="/compliance" className="font-semibold text-maroon-ink">
            compliance page
          </Link>{" "}
          for details.
        </p>
      </div>

      <h2 className="mt-10 mb-4 font-display text-xl font-semibold text-ink">Frequently asked questions</h2>
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
        {faqs.map((f) => (
          <div key={f.q} className="p-4">
            <h3 className="font-medium text-ink">{f.q}</h3>
            <p className="mt-1 text-sm text-ink-soft">{f.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/products">
          <Button>Browse Crackers →</Button>
        </Link>
      </div>
    </div>
  );
}
