import { brandConfig, getCanonicalUrl, getPhoneE164, getSiteUrl } from "@/config/brandConfig";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ListItemData {
  name: string;
  url: string;
  image?: string;
}

export interface ProductJsonLdParams {
  name: string;
  description?: string;
  sku?: string;
  image?: string;
  url: string;
  category?: string;
}

/**
 * Builds Schema.org Organization structured data.
 * Includes official brand details, address, contact point, and bilingual language support.
 */
export function buildOrganizationJsonLd(): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const canonicalHome = getCanonicalUrl("/");
  const phoneE164 = `+${getPhoneE164()}`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brandConfig.brand.name,
    alternateName: [brandConfig.brand.nameTamil, `${brandConfig.brand.name} Crackers`],
    url: canonicalHome,
    logo: `${siteUrl}${brandConfig.brand.logo.primary}`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: phoneE164,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["en", "ta"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: brandConfig.contact.address.line1,
      addressLocality: brandConfig.contact.address.district,
      addressRegion: brandConfig.contact.address.state,
      postalCode: brandConfig.contact.address.pincode,
      addressCountry: brandConfig.contact.address.country,
    },
  };

  const rawSocial = brandConfig.contact.social as Record<string, string | undefined> | undefined;
  const socialUrls = rawSocial
    ? Object.values(rawSocial).filter((url): url is string => typeof url === "string" && url.length > 0)
    : [];
  if (socialUrls.length > 0) {
    schema.sameAs = socialUrls;
  }

  return schema;
}

/**
 * Builds Schema.org WebSite structured data.
 */
export function buildWebSiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brandConfig.brand.name,
    alternateName: brandConfig.brand.nameTamil,
    url: getCanonicalUrl("/"),
  };
}

/**
 * Builds Schema.org BreadcrumbList structured data for rich breadcrumb trails.
 */
export function buildBreadcrumbJsonLd(crumbs: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * Builds Schema.org ItemList structured data for category catalogue views.
 */
export function buildItemListJsonLd(name: string, items: ListItemData[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

/**
 * Builds Schema.org Product structured data.
 * IMPORTANT: Kolagalam is an enquiry-only facilitator site, not an e-commerce checkout.
 * In strict compliance with Google Search Essentials and guidelines:
 * - We omit 'offers' (no online checkout/direct sale occurs on site).
 * - We strictly omit 'aggregateRating' and 'review' (no fake review manipulation).
 */
export function buildProductJsonLd(product: ProductJsonLdParams): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(product.image ? { image: product.image } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    url: product.url,
    brand: {
      "@type": "Brand",
      name: brandConfig.brand.name,
    },
    ...(product.category ? { category: product.category } : {}),
  };
}

/**
 * Server component that safely injects JSON-LD script tags with '<' character escaping.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
