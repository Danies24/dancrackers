/**
 * Site-wide facts that are legally load-bearing (§32.4, §32.5) or reused
 * across many components. NOT product data — that lives in the database.
 *
 * [BLOCKED / PLACEHOLDER] Supplier name, phone numbers and the address are
 * placeholders until confirmed in writing (PRD §42.1). Replace before launch.
 */
export const siteConfig = {
  name: "Dan Crackers",
  tagline: "Sivakasi crackers, ordered properly.",
  operator: {
    name: "Dan Crackers",
    address: "Avudiyapuram, Virudhunagar District, Tamil Nadu 626204",
    phoneDisplay: "9XXXXXXXXX", // [BLOCKED] replace with the real business number
    phoneE164: "91XXXXXXXXXX",
    email: "hello@dancrackersorders.com",
  },
  supplier: {
    // [BLOCKED] Name and address must be confirmed in writing (PRD §32.3, §42.1 item 7)
    // before this appears on a live page.
    name: "[Supplier name — pending written confirmation]",
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
