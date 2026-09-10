/**
 * Site-wide facts that are legally load-bearing (§32.4, §32.5) or reused
 * across many components. NOT product data — that lives in the database.
 *
 * Single source of truth — every page pulls the phone number and supplier
 * name from here, so updating either happens in exactly one place.
 *
 * [PLACEHOLDER] Supplier address is still generic (locality only). The PRD
 * (§32.3, §42.1 item 7) wants the full registered address confirmed in
 * writing before this appears on a live page.
 */
export const siteConfig = {
  name: "Dan Crackers",
  tagline: "Sivakasi crackers, ordered properly.",
  operator: {
    name: "Dan Crackers",
    address: "Avudiyapuram, Virudhunagar District, Tamil Nadu 626204",
    phoneDisplay: "82483 65737",
    phoneE164: "918248365737",
    email: "hello@dancrackersorders.com",
  },
  supplier: {
    // [PLACEHOLDER] Working name for now — confirm the final legal name and
    // full address with the supplier in writing before launch (§32.3).
    name: "Dan Fireworks",
    address: "Sivakasi, Tamil Nadu",
  },
  categoriesInFooter: 6,
} as const;

export const complianceNotice =
  "Online sale of firecrackers is not permitted. This website collects enquiries only. No payment is taken here. Payment is made directly to the supplier after confirmation.";

export const manufacturerFacilitatorNotice = {
  manufacturedBy: `Manufactured and sold by: ${siteConfig.supplier.name}`,
  facilitatedBy: `Orders facilitated by: ${siteConfig.operator.name}, ${siteConfig.operator.address}`,
};
