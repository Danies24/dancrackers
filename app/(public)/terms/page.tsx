import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Terms of Service</h1>
      <div className="prose-sm mt-6 flex flex-col gap-4 text-sm leading-relaxed text-ink-soft">
        <Section title="1. What this site is">
          <p>
            {siteConfig.name} operates a catalogue and order-enquiry service for fireworks manufactured and
            sold by {siteConfig.supplier.name}. We are not the seller or manufacturer of any product listed
            here.
          </p>
        </Section>
        <Section title="2. An enquiry is not a confirmed order">
          <p>
            Submitting the form on this site creates an <strong>enquiry</strong>, not a sale or a binding
            order. A confirmed order exists only after our team calls you and you agree on items, quantities
            and the final amount with the supplier.
          </p>
        </Section>
        <Section title="3. Prices are indicative">
          <p>
            Prices shown are supplied by the manufacturer and may change before your order is confirmed. Any
            change will be communicated on the confirmation call. The price stated when your order is
            confirmed is the price that applies.
          </p>
        </Section>
        <Section title="4. No online payment">
          <p>
            This site does not process payments of any kind. Payment is made directly to the supplier, after
            confirmation, by the method they specify (typically UPI or bank transfer).
          </p>
        </Section>
        <Section title="5. Delivery">
          <p>
            Delivery is arranged and performed by the supplier. We do not promise delivery dates on this site;
            any delivery expectation is set on the confirmation call and remains subject to the supplier's
            logistics and local regulations on the sale and use of fireworks.
          </p>
        </Section>
        <Section title="6. Captain referrals">
          <p>
            Some visitors arrive via a referral link from a "captain." Referral attribution is used only to
            calculate commissions payable to that captain and does not affect the price you pay.
          </p>
        </Section>
        <Section title="7. Contact">
          <p>
            Questions about these terms can be sent to {siteConfig.operator.email} or {siteConfig.operator.phoneDisplay}.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-1 font-semibold text-ink">{title}</h2>
      {children}
    </div>
  );
}
