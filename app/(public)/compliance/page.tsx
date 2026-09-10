import type { Metadata } from "next";
import { complianceNotice, manufacturerFacilitatorNotice, siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Compliance Notice" };

export default function CompliancePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Compliance Notice</h1>

      <div className="mt-6 rounded-lg border border-maroon/20 bg-maroon-tint p-4 text-sm font-medium text-maroon-ink">
        {complianceNotice}
      </div>

      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-ink-soft">
        <Section title="The legal position">
          <p>
            Fireworks are classified as explosives under the Explosives Act, 1884 and the Explosives Rules,
            2008. Manufacture and sale require licences (LE-1 for manufacture, LE-5 for possession and sale
            from a shop), held by the manufacturer.
          </p>
          <p className="mt-2">
            In <em>Arjun Gopal v. Union of India</em> (Supreme Court, 23 October 2018), the Court directed —
            alongside the green-cracker regime — that e-commerce platforms shall not accept online orders for
            firecrackers. This direction has been reaffirmed and enforced in subsequent orders. Accordingly,
            this website does not, and will never, process an online sale or payment for fireworks.
          </p>
        </Section>
        <Section title="Who does what">
          <p>{manufacturerFacilitatorNotice.manufacturedBy}</p>
          <p>{manufacturerFacilitatorNotice.facilitatedBy}</p>
          <p className="mt-2">
            {siteConfig.supplier.name} holds the licences required to manufacture and sell fireworks, invoices
            the customer directly, and is the seller of record. {siteConfig.operator.name} never possesses,
            stores, transports or sells fireworks, and never receives payment for them.
          </p>
        </Section>
        <Section title="What happens on this site">
          <ol className="list-decimal pl-5">
            <li>You browse a priced catalogue and build a list of what you want.</li>
            <li>You submit an enquiry with your contact and delivery details. No payment is requested or possible.</li>
            <li>A team member calls you to confirm the order and the final amount.</li>
            <li>You pay the supplier directly, by a method they specify.</li>
            <li>The supplier despatches your order.</li>
          </ol>
        </Section>
        <Section title="Local restrictions">
          <p>
            Permitted bursting hours, locations and green-cracker requirements are set by local and state
            authorities and vary each year. It is your responsibility to observe them.
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
