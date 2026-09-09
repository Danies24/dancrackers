import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Privacy Policy</h1>
      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-ink-soft">
        <Section title="What we collect">
          <p>
            When you submit an enquiry: your name, mobile number, delivery address, city, pincode, and
            optionally your email, a landmark, a preferred call time and notes. We also record which captain
            referral (if any) brought you here, and basic technical data (page URL, browser user agent).
          </p>
        </Section>
        <Section title="Why we collect it">
          <p>
            To call and confirm your order, to pass your delivery details to the supplier for despatch, to
            calculate captain commissions correctly, and to reach you again next season with relevant offers.
          </p>
        </Section>
        <Section title="Who we share it with">
          <p>
            Your name, phone number and delivery address are shared with {siteConfig.supplier.name} solely to
            fulfil your order. We do not sell your data to anyone. Captains never see your phone number or
            full address — only your first name, order status and amount.
          </p>
        </Section>
        <Section title="Analytics">
          <p>
            We use Google Analytics (GA4) and Microsoft Clarity to understand how the site is used and to fix
            problems. These tools do not receive your name, phone number or address — form inputs are masked.
            IP addresses are anonymised.
          </p>
        </Section>
        <Section title="How long we keep it">
          <p>
            Customer records are kept for the following Deepavali season's campaign, then reviewed. Order
            records are kept for accounting and dispute-resolution purposes.
          </p>
        </Section>
        <Section title="Deletion requests">
          <p>
            Email {siteConfig.operator.email} or call {siteConfig.operator.phoneDisplay} to request deletion.
            We will remove your personal details and anonymise any past orders within 30 days.
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
