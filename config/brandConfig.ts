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
    // TODO: replace once a real domain is registered — NEXT_PUBLIC_SITE_URL
    // takes priority at runtime (see getSiteUrl()), this is only the fallback.
    siteUrl: "TODO: https://kolagalam.example.com",
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
        // INTENTIONALLY BLANK — confirm the real manufacturer's legal name
        // and details in writing before this appears on a live page.
        name: "",
        role: "Manufactured and sold by",
        city: "Sivakasi",
        address: "",
        phone: "",
        licenceNo: "",
        isPrimary: true,
      },
    ],
    gstin: null,
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
      "Every price is clear upfront — no bargaining, no hidden markup.",
      "A real person calls you within 2 hours to confirm your order.",
      "You pay the licensed supplier directly — we never touch your money.",
    ],
  },

  seo: {
    titleTemplate: "%s | Kolagalam",
    defaultTitle: "Kolagalam — Sivakasi Crackers, Direct to You | Order Online",
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

export function getManufacturerFacilitatorNotice(): { manufacturedBy: string; facilitatedBy: string } {
  const supplier = getPrimarySupplier();
  return {
    manufacturedBy: `${supplier.role}: ${supplier.name}`,
    facilitatedBy: `${brandConfig.legal.facilitator.role}: ${brandConfig.legal.facilitator.name}, ${getFormattedAddress()}`,
  };
}
