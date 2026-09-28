import type { Metadata } from "next";
import { brandConfig, getCanonicalUrl, getGrievanceOfficer, getManufacturerFacilitatorNotice, getPrimarySupplier } from "@/config/brandConfig";

/** Bump this when the page's legal content materially changes. */
const LAST_UPDATED = "29 September 2026";

export const metadata: Metadata = {
  title: "Compliance & Legal Notice",
  description:
    "Important compliance notice: Kolagalam is an order booking facilitator for authentic Sivakasi crackers. Read our full legal disclosures.",
  alternates: {
    canonical: getCanonicalUrl("/compliance"),
  },
  openGraph: {
    title: "Compliance & Legal Notice",
    description:
      "Important compliance notice: Kolagalam is an order booking facilitator for authentic Sivakasi crackers. Read our full legal disclosures.",
    url: getCanonicalUrl("/compliance"),
  },
};

export default function CompliancePage() {
  const notice = getManufacturerFacilitatorNotice();
  const supplier = getPrimarySupplier();
  const grievanceOfficer = getGrievanceOfficer();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Compliance Notice</h1>
      <p className="mt-1 text-xs text-muted">Last updated: {LAST_UPDATED}</p>

      <div className="mt-6 rounded-lg border border-maroon/20 bg-maroon-tint p-4 text-sm font-medium text-maroon-ink">
        {brandConfig.legal.complianceNotice}
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
        <Section title="(a) Our role and the licensed seller">
          <p>{notice.facilitatedBy}</p>
          <p className="mt-2">
            Fireworks are manufactured and sold by licensed fireworks mills in Sivakasi holding the required
            statutory licences. Orders are facilitated by {brandConfig.legal.facilitator.name} directly connecting
            you with authentic Sivakasi fireworks.
          </p>
          {(notice.licenceLine || notice.licenceValidityLine || notice.gstinLine) && (
            <p className="mt-2">
              {notice.licenceLine && <>{notice.licenceLine}. </>}
              {notice.licenceValidityLine && <>{notice.licenceValidityLine}. </>}
              {notice.gstinLine && <>{notice.gstinLine}.</>}
            </p>
          )}
          {/* TODO(legal-review): licence holder name/number/validity above render only once
              config/brandConfig.ts's legal.suppliers[0] fields are confirmed — see the
              TODO(confirm) markers there. Never remove the omit-if-unconfirmed check. */}
        </Section>
        <Section title="(b) Age restriction">
          <p>
            Fireworks may only be purchased by, and enquiries submitted by, someone 18 years of age or older.
            Our enquiry form asks you to confirm this before submitting.
          </p>
        </Section>
        <Section title="(c) Storage, handling and transport">
          <p>
            Fireworks are explosives. Goods are dispatched only via authorised transporters. Once delivered,
            safe storage, handling and lawful use are the buyer&apos;s responsibility — please review our{" "}
            <a href="/safety" className="font-semibold text-maroon-ink hover:underline">
              Safety Guidance
            </a>
            .
          </p>
        </Section>
        <Section title="(d) Local restrictions and green crackers">
          <p>
            Permitted bursting hours, locations and green-cracker requirements are set by local and state
            authorities and vary each year — it is your responsibility to observe them. We may decline to
            accept or deliver an order to a location where fireworks sale or delivery is restricted or banned.
          </p>
        </Section>
        <Section title="(e) Right to refuse or cancel">
          <p>
            We may refuse or cancel an enquiry at our discretion — including where an order can&apos;t be
            fulfilled safely or lawfully, where details can&apos;t be verified, or where delivery is to a
            restricted location.
          </p>
        </Section>
        <Section title="(f) Grievance officer">
          {grievanceOfficer ? (
            <p>
              {grievanceOfficer.name} — {grievanceOfficer.email} — {grievanceOfficer.phone}
            </p>
          ) : (
            // TODO(confirm): a named grievance officer is required for an
            // Indian consumer-facing site — fill config/brandConfig.ts's
            // legal.grievanceOfficer, never print "TODO(confirm)" here.
            <p>
              For any grievance, contact us using the details on our{" "}
              <a href="/contact" className="font-semibold text-maroon-ink hover:underline">
                Contact page
              </a>
              .
            </p>
          )}
        </Section>
        <Section title="(g) Governing law and jurisdiction">
          {/* TODO(legal-review): confirm this clause with counsel before relying on it. */}
          <p>
            These terms are governed by the laws of {brandConfig.legal.governingLaw.country}. Subject to
            applicable law, the courts at {brandConfig.legal.governingLaw.courts} shall have jurisdiction.
          </p>
        </Section>
        <Section title="What happens on this site">
          <ol className="list-decimal pl-5">
            <li>You browse a priced catalogue and build a list of what you want.</li>
            <li>You submit an enquiry with your contact and delivery details. No payment is requested or possible.</li>
            <li>A team member calls you to confirm the order and the final amount.</li>
            <li>Pay securely by UPI or bank transfer after our confirmation call.</li>
            <li>Your order is packed carefully and despatched to your area.</li>
          </ol>
        </Section>
        <Section title="Supplier">
          <p>
            Manufactured and sold by a licensed fireworks mill based in {supplier.city}.
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
