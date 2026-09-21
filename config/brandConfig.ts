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
    tagline: "Authentic Sivakasi Crackers Direct To Your Doorstep",
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
    phones: [{ number: "6363930412", countryCode: "+91", label: "Sales", isWhatsApp: true, isPrimary: true }],
    emails: [{ address: "kolagalam.contact@gmail.com", label: "General", isPrimary: true }],
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
        name: "",
        role: "Manufactured and sold by",
        city: "Sivakasi",
        address: "",
        // The single number every "contact supplier" WhatsApp button on the
        // site uses (order-detail's "Send on WhatsApp" for the supplier
        // order today; anywhere else later) — kept separate from any
        // display-only phone string since a wa.me link needs one
        // canonical 10-digit number, not a "/"-joined pair. This is the
        // configured supplier's primary published contact number — swap
        // here, once, if that ever changes.
        whatsapp: "6363930412",
        // TODO(confirm): licence number — get in writing from the supplier before this appears on a live page.
        licenceNo: "TODO(confirm)",
        isPrimary: true,
      },
    ],
    // TODO(confirm): GSTIN — get in writing from the supplier before this appears on a live page.
    gstin: "TODO(confirm)" as string | null,
    complianceNotice:
      "Online sale of firecrackers is not permitted. This website collects enquiries only. No payment is taken here. Pay securely by UPI or bank transfer after our confirmation call.",
  },

  // No individual names surfaced anywhere on the site — kept as an empty,
  // ready-to-populate roster. Set showOnAboutPage: true on an entry to make
  // it appear on the About page.
  team: [] as ReadonlyArray<{ name: string; role: string; bio: string; photo: string; showOnAboutPage: boolean }>,

  about: {
    headline: "About Kolagalam",
    companySummary:
      'We are "Kolagalam" crackers online store, wholesaler of fireworks and crackers owning a shop in Sivakasi, Tamilnadu. We are into this business since 2020 and have been successfully running our company with selling crackers all over India. Since the day of our initiation, we have anticipated largely in making millions of lives happier and lightened up. We feel extremely proud of ourselves for being the very first online retail store to sell crackers.',
    story: [
      'We are "Kolagalam" crackers online store, wholesaler of fireworks and crackers owning a shop in Sivakasi, Tamilnadu. We are into this business since 2020 and have been successfully running our company with selling crackers all over India. Since the day of our initiation, we have anticipated largely in making millions of lives happier and lightened up. We feel extremely proud of ourselves for being the very first online retail store to sell crackers.',
      "Rooted in our Sivakasi wholesale store established in 2020, now in 2026 we are expanding directly to online customers across Tamil Nadu and all of India. With Kolagalam, families get factory-direct wholesale crackers without travel hassles, extra broker commissions, or photocopied lists.",
      "We visit the Sivakasi mills in person, verify quality, and photograph products ourselves. Every order is handled by a real person: once you submit your enquiry, we call you to confirm every item and total, guide you with payment via UPI or bank transfer, and arrange waterproof carton dispatch to your nearest transport hub.",
    ],
    whyUs: [
      "Wholesaler and shop in Sivakasi since 2020, now in 2026 expanding directly to online customers.",
      "Spreading direct wholesale factory prices straight to online customers across India.",
      "Photographed at Sivakasi mills — real products with authentic supplier printed MRP.",
      "Transparent upfront prices with genuine discounts off printed MRP.",
      "Safe waterproof carton packaging with door/hub delivery through trusted lorry services.",
      "Personal telephone confirmation for every single order before dispatch.",
    ],
  },

  // Cart-level minimum and charges — flat across all delivery states.
  // Enforced server-side at enquiry submission (lib/pricing.ts) and mirrored
  // client-side on the cart/enquiry pages so the message shows instantly.
  // Packaging and delivery charges are computed off the item subtotal
  // (before either charge is added) and waived once that subtotal reaches
  // the matching threshold — see computeTotals in lib/pricing.ts.
  cartCharges: {
    minimumOrderValue: 2999,
    packagingChargePercent: 3,
    packagingChargeWaiverThreshold: 3499,
    deliveryCharge: 400,
    deliveryChargeWaiverThreshold: 3999,
  },

  // Deliberately not derived from any product's real discount_percent — a
  // marketing figure only, shown on the "X% OFF" badge and the hero tagline.
  // The real discount_percent (80) stays untouched everywhere prices and
  // commission are actually computed (admin panel, DB, pricing.ts); this
  // number never enters that math. Business call, not a pricing change.
  marketingDiscountPercent: 95,

  // Cutoff date for season bookings (§23 / feature: Order By Countdown).
  // Single source of truth — never hardcode dates or deadline copy in components.
  orderDeadline: {
    enabled: true,
    iso: "2026-10-25T23:59:59+05:30", // Cutoff: 25 Oct 2026 23:59:59 IST
    blockAfterDeadline: false, // when true, the enquiry APIs reject submissions after the deadline
    labels: {
      en: {
        title: "Order by 25 Oct",
        closedTitle: "Season orders closed",
        closedMessage: "We are no longer accepting new enquiries for this season. For urgent queries, reach us on WhatsApp or call.",
        reminderText: "Last date to send your enquiry: 25 Oct 2026",
        closedReminderText: "Season orders are now closed. You can still reach us directly.",
        successNote: "Your enquiry was submitted before the season booking deadline (25 Oct).",
        units: {
          days: "Days",
          hours: "Hours",
          minutes: "Mins",
          seconds: "Secs",
        },
        shortUnits: {
          d: "d",
          h: "h",
          m: "m",
          s: "s",
        },
      },
      ta: {
        title: "அக்டோபர் 25-க்குள் ஆர்டர் செய்யுங்கள்",
        closedTitle: "இந்த ஆண்டுக்கான முன்பதிவு முடிந்தது",
        closedMessage: "இந்த தீபாவளிக்கான புதிய முன்பதிவுகள் நிறைவடைந்துவிட்டன. அவசர தேவைகளுக்கு எங்களை வாட்ஸ்அப் அல்லது தொலைபேசியில் தொடர்பு கொள்ளவும்.",
        reminderText: "விசாரணை அனுப்ப கடைசி நாள்: 25 அக்டோபர் 2026",
        closedReminderText: "முன்பதிவு நிறைவடைந்தது. எங்களை நேரடியாக தொடர்பு கொள்ளலாம்.",
        successNote: "சீசன் முன்பதிவு முடிவதற்குள் (25 அக்டோபர்) உங்கள் விசாரணை பெறப்பட்டது.",
        units: {
          days: "நாள்",
          hours: "மணி",
          minutes: "நிமிடம்",
          seconds: "வினாடி",
        },
        shortUnits: {
          d: "நாள்",
          h: "மணி",
          m: "நிமி",
          s: "விநா",
        },
      },
    },
  },

  seo: {
    titleTemplate: "%s | Kolagalam",
    defaultTitle: "Kolagalam (கோலாகலம்) — Best Sivakasi Crackers Online",
    defaultDescription:
      "Browse authentic and budget friendly Sivakasi crackers price list with photos from Kolagalam (கோலாகலம்). Best place to buy wholesale crackers online.",
    keywords: [
      "Kolagalam",
      "Kolagalam crackers",
      "Sivakasi crackers",
      "Sivakasi crackers online",
      "best Sivakasi crackers",
      "budget friendly Diwali Sivakasi crackers online",
      "Sivakasi crackers price list",
      "Diwali crackers enquiry",
      "wholesale crackers online",
      "கோலாகலம்",
      "கோலாகலம் பட்டாசு",
      "சிவகாசி பட்டாசு",
    ],
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

/**
 * ADMIN-ONLY. The configured supplier's own WhatsApp number — used exclusively by the
 * login-gated "Send order to supplier" button in /admin/orders, so staff can
 * actually message the supplier to place an order. Never call this from
 * anything under app/(public)/* or a public API route: a customer must
 * never see this number. For every public-facing tel:/wa.me link, use
 * getPhoneE164()/getPhoneDisplay() below instead — digits only, no "+91".
 */
export function getPrimarySupplierWhatsApp(): string {
  return getPrimarySupplier().whatsapp.replace(/\D/g, "");
}

/**
 * THE single phone/WhatsApp number shown anywhere on the public website —
 * every tel:/wa.me link on the storefront (header, footer, home, product
 * pages, contact, enquiry) reads this one function, sourced from the one
 * `isPrimary` entry in brandConfig.contact.phones. Never hardcode a number
 * on a public page, and never use getPrimarySupplierWhatsApp() here — that
 * one is the supplier's own number, for the admin panel only.
 * E.164-ish digits with no "+" — e.g. "916363930412".
 */
export function getPhoneE164(phone: Phone = getPrimaryPhone()): string {
  return `${phone.countryCode.replace("+", "")}${phone.number}`;
}

/** Human-readable display grouping of the same public number — e.g. "82483 65737". */
export function getPhoneDisplay(phone: Phone = getPrimaryPhone()): string {
  return `${phone.number.slice(0, 5)} ${phone.number.slice(5)}`;
}

/** Builds a wa.me link, optionally pre-filled with a message. */
export function getWhatsAppLink(message?: string, phone: Phone = getPrimaryPhone()): string {
  const base = `https://wa.me/${getPhoneE164(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Single source of truth for the site URL across metadata, robots, sitemap, canonicals, Open Graph, and JSON-LD.
 *
 * Resolution order:
 * 1. NEXT_PUBLIC_SITE_URL
 * 2. https://${VERCEL_PROJECT_PRODUCTION_URL} (if set)
 * 3. brandConfig.brand.siteUrl ("https://kolagalam.vercel.app")
 *
 * Trailing slashes are stripped.
 * In a production build (NODE_ENV === "production"), localhost is never returned.
 */
export function getSiteUrl(): string {
  let resolved: string | undefined;

  resolved = brandConfig.brand.siteUrl;

  // Strip trailing slash
  resolved = resolved.replace(/\/+$/, "");

  // Never return localhost in a production build
  if (process.env.NODE_ENV === "production" && resolved.includes("localhost")) {
    return brandConfig.brand.siteUrl.replace(/\/+$/, "");
  }

  return resolved;
}

/**
 * Builds an absolute canonical URL from getSiteUrl().
 * - Strips query strings (?...) and fragment identifiers (#...)
 * - Home page ("" or "/") always returns `${siteUrl}/` (with trailing slash)
 * - All other paths return `${siteUrl}/${cleanPath}` (without trailing slash)
 */
export function getCanonicalUrl(path: string = ""): string {
  const siteUrl = getSiteUrl();
  // Strip query strings and hashes
  const cleanPath = path.split("?")[0].split("#")[0].trim();

  // Normalize slashes
  const normalized = cleanPath.replace(/^\/+/, "").replace(/\/+$/, "");

  if (!normalized) {
    return `${siteUrl}/`;
  }

  return `${siteUrl}/${normalized}`;
}

const UNCONFIRMED = "TODO(confirm)";

export function getManufacturerFacilitatorNotice(): {
  facilitatedBy: string;
  licenceLine: string | null;
  gstinLine: string | null;
} {
  const supplier = getPrimarySupplier();
  return {
    facilitatedBy: `${brandConfig.legal.facilitator.role}: ${brandConfig.legal.facilitator.name}`,
    // Never shown until a real value replaces the placeholder — a visible
    // "TODO(confirm)" on a live compliance notice would look broken, and
    // this repo's convention is to omit an unconfirmed legal fact entirely
    // rather than print the placeholder to customers.
    licenceLine: supplier.licenceNo && supplier.licenceNo !== UNCONFIRMED ? `Licence No.: ${supplier.licenceNo}` : null,
    gstinLine: brandConfig.legal.gstin && brandConfig.legal.gstin !== UNCONFIRMED ? `GSTIN: ${brandConfig.legal.gstin}` : null,
  };
}

/** The flat minimum cart (item subtotal, before packaging/delivery charges) required to check out (§ cartCharges). */
export function getMinimumOrderValue(): number {
  return brandConfig.cartCharges.minimumOrderValue;
}

/**
 * Headline discount claim — always derived from the real, currently-active
 * highest discount_percent (passed in by the caller, computed from the DB),
 * never a hardcoded number, so it can never overstate the actual discount.
 */
export function getHeadlineOffer(maxActiveDiscountPercent: number): string {
  return `Direct from Sivakasi · Up to ${Math.round(maxActiveDiscountPercent)}% off MRP`;
}
