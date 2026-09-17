/**
 * Single source of truth for every brand fact used across the site — name,
 * contact details, legal/compliance wording, team, About copy, SEO
 * defaults, and message templates. Components should never rebuild these
 * strings themselves; use the exported helpers below.
 *
 * The compliance notice and manufacturer/facilitator wording are legally
 * load-bearing (this is an enquiry-only facilitator, not the seller of
 * record) — do not reword them without checking the legal positioning
 * still holds.
 */
export const brandConfig = {
  brand: {
    name: "Kolagalam",
    nameTamil: "கோலாகலம்",
    descriptor: "Sivakasi Crackers",
    // TODO: write a real tagline for Kolagalam (shown in the OG image and site metadata).
    tagline: "TODO: Kolagalam tagline",
    // Replace once a real custom domain (e.g. kolagalam.com) is registered —
    // NEXT_PUBLIC_SITE_URL takes priority at runtime (see getSiteUrl()),
    // this is only the fallback if that env var isn't set.
    siteUrl: "https://kolagalam.vercel.app",
    logo: {
      primary: "/brand/logo-primary.svg",
      dark: "/brand/logo-dark.svg",
      icon: "/brand/icon.svg",
      favicon: "/brand/favicon.ico",
      ogImage: "/brand/og-image.svg",
    },
  },

  contact: {
    phones: [{ number: "8248365737", countryCode: "+91", label: "Sales", isWhatsApp: true, isPrimary: true }],
    emails: [{ address: "sdmdanies24@gmail.com", label: "General", isPrimary: true }],
    address: {
      line1: "Avudiyapuram",
      district: "Virudhunagar District",
      state: "Tamil Nadu",
      pincode: "626204",
      country: "India",
    },
    responseTimeText: "A real person calls you within 2 hours",
    // TODO: confirm real business hours.
    businessHours: "TODO: e.g. Mon–Sat, 9am–8pm IST",
    social: {
      instagram: undefined,
      facebook: undefined,
      youtube: undefined,
      whatsappChannel: undefined,
    },
  },

  legal: {
    facilitator: { name: "Kolagalam", role: "Orders facilitated by" },
    suppliers: [
      {
        name: "Sree Sai Ram Crackers (Kids Crackers Park)",
        role: "Manufactured and sold by",
        city: "Sivakasi",
        address: "3/268 D Sivakasi–Sattur Road, Opp. Sri Sankari Mahal, Chinnakamanpatti, Sivakasi 626 189",
        phone: "99946 37193 / 96297 24212",
        // TODO(confirm): licence number — get in writing from the supplier before this appears on a live page.
        licenceNo: "TODO(confirm)",
        isPrimary: true,
      },
    ],
    // TODO(confirm): GSTIN — get in writing from the supplier before this appears on a live page.
    gstin: "TODO(confirm)" as string | null,
    complianceNotice:
      "Online sale of firecrackers is not permitted. This website collects enquiries only. No payment is taken here. Payment is made directly to the supplier after confirmation.",
  },

  // No individual names surfaced anywhere on the site — kept as an empty,
  // ready-to-populate roster. Set showOnAboutPage: true on an entry to make
  // it appear on the About page.
  team: [] as ReadonlyArray<{ name: string; role: string; bio: string; photo: string; showOnAboutPage: boolean }>,

  about: {
    headline: "About Us",
    story: [
      "We are based near Sivakasi, close to the mills — so we can visit in person, check products, and photograph them ourselves, rather than relying on a photocopied price list. One part of the team handles the catalogue, technology, and the order desk; another handles field relationships and customer calls.",
      "That is the whole reason this site exists: to replace a hard-to-read paper list with something you can actually see, search and trust.",
    ],
    whyUs: [
      "We visit the mills ourselves and photograph real products — no photocopied price lists.",
      "Every price is clear upfront, discounted straight off the printed MRP.",
      "A real person calls you within 2 hours to confirm your order.",
      "You pay the licensed supplier directly — we never touch your money.",
    ],
  },

  // Order minimums by delivery state — orders below the applicable minimum
  // are blocked at enquiry submission (server-side authoritative, client
  // shows the message as soon as a state is picked).
  orderMinimums: {
    tamilNadu: 3000,
    otherStates: 5000,
  },

  // Deliberately not derived from any product's real discount_percent — a
  // marketing figure only, shown on the "X% OFF" badge and the hero tagline.
  // The real discount_percent (80) stays untouched everywhere prices and
  // commission are actually computed (admin panel, DB, pricing.ts); this
  // number never enters that math. Business call, not a pricing change.
  marketingDiscountPercent: 95,

  seo: {
    titleTemplate: "%s | Kolagalam",
    defaultTitle: "Kolagalam — Sivakasi Crackers, Direct to You | Enquire Now",
    defaultDescription:
      "Browse the full Sivakasi crackers price list with photos. Build your order, we call you to confirm. Supplied by licensed Sivakasi manufacturers.",
    keywords: ["Sivakasi crackers", "Diwali crackers online", "firecrackers Chennai", "Kolagalam"],
  },

  messages: {
    whatsappGreeting: "Hi Kolagalam, I have submitted an order enquiry.",
    // {link} is substituted at build time by buildCaptainKitMessage (lib/whatsapp.ts).
    captainShareMessage:
      "Naan indha Deepavali crackers Sivakasi-la irundhu direct-a order panren. Rate ellame website-la clear-a irukku, delivery gate varaikkum vandhudum. Idho link — {link}",
    supplierOrderHeader: "Booked by: Kolagalam",
  },
} as const;

export type BrandConfig = typeof brandConfig;

type Phone = BrandConfig["contact"]["phones"][number];
type Email = BrandConfig["contact"]["emails"][number];
type Supplier = BrandConfig["legal"]["suppliers"][number];

export function getPrimaryPhone(): Phone {
  return brandConfig.contact.phones.find((p) => p.isPrimary) ?? brandConfig.contact.phones[0];
}

export function getPrimaryEmail(): Email {
  return brandConfig.contact.emails.find((e) => e.isPrimary) ?? brandConfig.contact.emails[0];
}

export function getPrimarySupplier(): Supplier {
  return brandConfig.legal.suppliers.find((s) => s.isPrimary) ?? brandConfig.legal.suppliers[0];
}

/** E.164-ish digits with no "+" — e.g. "918248365737". Matches wa.me / tel: link conventions used across the site. */
export function getPhoneE164(phone: Phone = getPrimaryPhone()): string {
  return `${phone.countryCode.replace("+", "")}${phone.number}`;
}

/** Human-readable display grouping — e.g. "82483 65737". */
export function getPhoneDisplay(phone: Phone = getPrimaryPhone()): string {
  return `${phone.number.slice(0, 5)} ${phone.number.slice(5)}`;
}

/** Builds a wa.me link, optionally pre-filled with a message. */
export function getWhatsAppLink(message?: string, phone: Phone = getPrimaryPhone()): string {
  const base = `https://wa.me/${getPhoneE164(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function getFormattedAddress(): string {
  const { line1, district, state, pincode } = brandConfig.contact.address;
  return `${line1}, ${district}, ${state} ${pincode}`;
}

/** Runtime site URL — NEXT_PUBLIC_SITE_URL wins once a real domain is set; brandConfig is only the fallback. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? brandConfig.brand.siteUrl;
}

const UNCONFIRMED = "TODO(confirm)";

export function getManufacturerFacilitatorNotice(): {
  manufacturedBy: string;
  facilitatedBy: string;
  licenceLine: string | null;
  gstinLine: string | null;
} {
  const supplier = getPrimarySupplier();
  return {
    manufacturedBy: `${supplier.role}: ${supplier.name}, ${supplier.address}`,
    facilitatedBy: `${brandConfig.legal.facilitator.role}: ${brandConfig.legal.facilitator.name}, ${getFormattedAddress()}`,
    // Never shown until a real value replaces the placeholder — a visible
    // "TODO(confirm)" on a live compliance notice would look broken, and
    // this repo's convention is to omit an unconfirmed legal fact entirely
    // rather than print the placeholder to customers.
    licenceLine: supplier.licenceNo && supplier.licenceNo !== UNCONFIRMED ? `Licence No.: ${supplier.licenceNo}` : null,
    gstinLine: brandConfig.legal.gstin && brandConfig.legal.gstin !== UNCONFIRMED ? `GSTIN: ${brandConfig.legal.gstin}` : null,
  };
}

/** The minimum order value for a delivery state — Tamil Nadu vs everywhere else (§ orderMinimums). */
export function getMinimumOrderValue(state?: string | null): number {
  const isTamilNadu = (state ?? "").trim().toLowerCase() === "tamil nadu";
  return isTamilNadu ? brandConfig.orderMinimums.tamilNadu : brandConfig.orderMinimums.otherStates;
}

/**
 * Headline discount claim — always derived from the real, currently-active
 * highest discount_percent (passed in by the caller, computed from the DB),
 * never a hardcoded number, so it can never overstate the actual discount.
 */
export function getHeadlineOffer(maxActiveDiscountPercent: number): string {
  return `Direct from Sivakasi · Up to ${Math.round(maxActiveDiscountPercent)}% off MRP`;
}
