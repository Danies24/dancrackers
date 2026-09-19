import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data", () => ({
  getActiveCategories: vi.fn().mockResolvedValue([
    { id: "1", name_en: "Sparklers", name_ta: "கம்பி மத்தாப்பு", slug: "sparklers", created_at: "2026-01-01" },
  ]),
  getCatalogue: vi.fn().mockResolvedValue([
    { id: "p1", name_en: "10cm Sparklers", slug: "10cm-sparklers", status: "active" },
  ]),
  getCategoryWithCounts: vi.fn().mockResolvedValue([]),
  getMaxActiveDiscountPercent: vi.fn().mockResolvedValue(0),
}));
vi.mock("@/lib/combo-packs", () => ({
  getActiveComboPacks: vi.fn().mockResolvedValue([]),
}));

import fs from "fs";
import path from "path";
import { brandConfig, getCanonicalUrl, getSiteUrl } from "@/config/brandConfig";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  buildOrganizationJsonLd,
  buildProductJsonLd,
  buildWebSiteJsonLd,
} from "./jsonld";

describe("SEO Foundation: getSiteUrl & getCanonicalUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("prioritizes NEXT_PUBLIC_SITE_URL and strips trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://kolagalam.in/";
    expect(getSiteUrl()).toBe("https://kolagalam.in");
  });

  it("falls back to VERCEL_PROJECT_PRODUCTION_URL with https://", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "kolagalam.vercel.app/";
    expect(getSiteUrl()).toBe("https://kolagalam.vercel.app");
  });

  it("falls back to brandConfig.brand.siteUrl when env vars are unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(getSiteUrl()).toBe(brandConfig.brand.siteUrl);
  });

  it("never returns localhost in production mode", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    expect(getSiteUrl()).toBe(brandConfig.brand.siteUrl);
    expect(getSiteUrl()).not.toContain("localhost");
  });

  it("getCanonicalUrl produces correct normalized canonical URLs", () => {
    const siteUrl = getSiteUrl();

    // Home returns siteUrl with trailing slash
    expect(getCanonicalUrl("/")).toBe(`${siteUrl}/`);
    expect(getCanonicalUrl("")).toBe(`${siteUrl}/`);

    // Subpages return siteUrl/path without trailing slash
    expect(getCanonicalUrl("/products")).toBe(`${siteUrl}/products`);
    expect(getCanonicalUrl("/products/")).toBe(`${siteUrl}/products`);
    expect(getCanonicalUrl("about")).toBe(`${siteUrl}/about`);

    // Strips query parameters and hashes
    expect(getCanonicalUrl("/products?cat=sparklers#filter")).toBe(`${siteUrl}/products`);
    expect(getCanonicalUrl("/product/chakkar-10?ref=whatsapp")).toBe(`${siteUrl}/product/chakkar-10`);
  });
});

describe("SEO Foundation: robots.txt", () => {
  it("generates correct robots rules with sitemap link", () => {
    const rules = robots();
    const siteUrl = getSiteUrl();

    expect(rules.sitemap).toBe(`${siteUrl}/sitemap.xml`);

    const userAgent = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules;
    expect(userAgent).toBeDefined();

    const disallow = Array.isArray(userAgent?.disallow)
      ? userAgent.disallow
      : [userAgent?.disallow];

    // Only admin and api are disallowed
    expect(disallow).toContain("/admin");
    expect(disallow).toContain("/api");

    // Private customer routes (/cart, /enquiry) must NOT be blocked by robots.txt
    // so crawlers can visit and read the 'noindex' meta tag and header
    expect(disallow).not.toContain("/cart");
    expect(disallow).not.toContain("/enquiry");
    expect(disallow).not.toContain("/captain");
  });
});

describe("SEO Foundation: sitemap.xml", () => {
  it("includes all public indexable static pages and excludes private routes", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    const expectedStaticPages = [
      getCanonicalUrl("/"),
      getCanonicalUrl("/products"),
      getCanonicalUrl("/how-it-works"),
      getCanonicalUrl("/safety"),
      getCanonicalUrl("/about"),
      getCanonicalUrl("/contact"),
      getCanonicalUrl("/faq"),
      getCanonicalUrl("/compliance"),
      getCanonicalUrl("/terms"),
      getCanonicalUrl("/privacy"),
    ];

    for (const expected of expectedStaticPages) {
      expect(urls).toContain(expected);
    }

    // Must never contain private or admin paths
    for (const url of urls) {
      expect(url).not.toMatch(/\/(admin|cart|enquiry|captain|c\/)/);
      // All URLs must be absolute
      expect(url.startsWith("http://") || url.startsWith("https://")).toBe(true);
    }

    // No duplicate URLs
    const uniqueUrls = new Set(urls);
    expect(urls.length).toBe(uniqueUrls.size);
  });
});

describe("SEO Foundation: Structured Data (JSON-LD)", () => {
  it("builds valid Organization schema without TODOs or fake reviews", () => {
    const org = buildOrganizationJsonLd();
    const jsonStr = JSON.stringify(org);

    expect(org["@context"]).toBe("https://schema.org");
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe("Kolagalam");
    expect(org.url).toBe(getCanonicalUrl("/"));
    expect(typeof org.logo).toBe("string");
    expect((org.logo as string).startsWith("http")).toBe(true);
    expect(org.logo).not.toContain("[object");

    // Contact point
    const cp = org.contactPoint as Record<string, unknown>;
    expect(cp["@type"]).toBe("ContactPoint");
    expect(cp.telephone).toMatch(/^\+\d+/);
    expect(cp.areaServed).toBe("IN");

    // Address
    const addr = org.address as Record<string, unknown>;
    expect(addr["@type"]).toBe("PostalAddress");
    expect(addr.addressLocality).toBeDefined();
    expect(addr.postalCode).toBe("626204");

    // No TODOs
    expect(jsonStr).not.toContain("TODO");
  });

  it("builds valid WebSite schema", () => {
    const ws = buildWebSiteJsonLd();
    expect(ws["@context"]).toBe("https://schema.org");
    expect(ws["@type"]).toBe("WebSite");
    expect(ws.name).toBe("Kolagalam");
    expect(ws.alternateName).toBe("கோலாகலம்");
    expect(ws.url).toBe(getCanonicalUrl("/"));
  });

  it("builds valid BreadcrumbList schema", () => {
    const crumbs = [
      { name: "Home", url: getCanonicalUrl("/") },
      { name: "Products", url: getCanonicalUrl("/products") },
      { name: "Sparklers", url: getCanonicalUrl("/products/sparklers") },
    ];
    const breadcrumb = buildBreadcrumbJsonLd(crumbs);
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");

    const items = breadcrumb.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(3);
    expect(items[0].position).toBe(1);
    expect(items[0].name).toBe("Home");
    expect(items[0].item).toBe(getCanonicalUrl("/"));
    expect(items[2].position).toBe(3);
    expect(items[2].name).toBe("Sparklers");
  });

  it("builds valid ItemList schema for categories", () => {
    const items = [
      { name: "10cm Sparklers", url: getCanonicalUrl("/product/10cm-sparklers") },
      { name: "15cm Sparklers", url: getCanonicalUrl("/product/15cm-sparklers") },
    ];
    const list = buildItemListJsonLd("Sparklers", items);
    expect(list["@type"]).toBe("ItemList");
    expect(list.name).toBe("Sparklers");
    expect(list.numberOfItems).toBe(2);
  });

  it("strictly omits 'offers', 'aggregateRating', and 'review' from Product schema", () => {
    const product = buildProductJsonLd({
      name: "Standard Ground Chakkar",
      description: "Traditional spinning ground wheel.",
      sku: "GC-001",
      image: "https://kolagalam.vercel.app/images/chakkar.jpg",
      url: getCanonicalUrl("/product/standard-ground-chakkar"),
      category: "Ground Chakkars",
    });

    expect(product["@context"]).toBe("https://schema.org");
    expect(product["@type"]).toBe("Product");
    expect(product.name).toBe("Standard Ground Chakkar");
    expect(product.sku).toBe("GC-001");
    expect((product.brand as Record<string, unknown>).name).toBe("Kolagalam");

    // HARD RULES FOR COMPLIANCE & GOOGLE GUIDELINES:
    // Kolagalam is an enquiry facilitator (no direct online checkout),
    // and must NEVER fabricate fake ratings/reviews.
    expect(product).not.toHaveProperty("offers");
    expect(product).not.toHaveProperty("aggregateRating");
    expect(product).not.toHaveProperty("review");
  });
});

describe("SEO Foundation: On-Page Metadata Constraints", () => {
  const resolveFullTitle = (pageTitle: string | { absolute: string }): string => {
    if (typeof pageTitle === "object" && pageTitle.absolute) {
      return pageTitle.absolute;
    }
    return brandConfig.seo.titleTemplate.replace("%s", pageTitle as string);
  };

  it("default brand title and template satisfy length limits", () => {
    expect(brandConfig.seo.defaultTitle.length).toBeLessThanOrEqual(60);
    expect(brandConfig.seo.defaultDescription.length).toBeLessThanOrEqual(155);
  });

  it("home page title and description adhere to character limits", async () => {
    const homePageMod = await import("@/app/(public)/page");
    const meta = homePageMod.metadata;
    expect(meta).toBeDefined();

    const titleStr = typeof meta.title === "object" && meta.title && "absolute" in meta.title
      ? (meta.title as { absolute: string }).absolute
      : String(meta.title);

    expect(titleStr.length).toBeLessThanOrEqual(60);
    expect(String(meta.description).length).toBeLessThanOrEqual(155);
  });

  it("products catalog page metadata adheres to character limits", async () => {
    const mod = await import("@/app/(public)/products/page");
    const meta = mod.metadata;
    expect(meta).toBeDefined();

    const fullTitle = resolveFullTitle(meta.title as string);
    expect(fullTitle.length).toBeLessThanOrEqual(60);
    expect(String(meta.description).length).toBeLessThanOrEqual(155);
  });

  it("all static informational pages adhere to title (<= 60) and description (<= 155) limits", async () => {
    const pages = [
      { name: "about", loader: () => import("@/app/(public)/about/page") },
      { name: "contact", loader: () => import("@/app/(public)/contact/page") },
      { name: "how-it-works", loader: () => import("@/app/(public)/how-it-works/page") },
      { name: "safety", loader: () => import("@/app/(public)/safety/page") },
      { name: "compliance", loader: () => import("@/app/(public)/compliance/page") },
      { name: "faq", loader: () => import("@/app/(public)/faq/page") },
      { name: "terms", loader: () => import("@/app/(public)/terms/page") },
      { name: "privacy", loader: () => import("@/app/(public)/privacy/page") },
    ];

    for (const page of pages) {
      const mod = await page.loader();
      const meta = mod.metadata;
      expect(meta, `Metadata for ${page.name} should be exported`).toBeDefined();

      const fullTitle = resolveFullTitle(meta.title as string);
      expect(
        fullTitle.length,
        `Page '${page.name}' title '${fullTitle}' exceeds 60 chars (${fullTitle.length})`
      ).toBeLessThanOrEqual(60);

      expect(
        String(meta.description).length,
        `Page '${page.name}' description exceeds 155 chars (${String(meta.description).length})`
      ).toBeLessThanOrEqual(155);
    }
  });
});

describe("SEO Foundation: Brand Leak / Cleanliness Verification", () => {
  it("ensures no source files hardcode 'dancrackers.vercel.app' or 'Dan Crackers'", () => {
    const srcDirs = ["app", "components", "config", "lib"];
    const forbiddenPatterns = ["dancrackers.vercel.app", "Dan Crackers"];

    const projectRoot = path.resolve(__dirname, "../..");
    const violations: string[] = [];

    function scanDir(dirPath: string) {
      if (!fs.existsSync(dirPath)) return;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== ".next") {
            scanDir(fullPath);
          }
        } else if (/\.(tsx?|jsx?|json|md)$/.test(entry.name)) {
          // Skip test file itself
          if (entry.name === "seo.test.ts") continue;

          const content = fs.readFileSync(fullPath, "utf-8");
          for (const pattern of forbiddenPatterns) {
            if (content.includes(pattern)) {
              violations.push(`${path.relative(projectRoot, fullPath)} contains '${pattern}'`);
            }
          }
        }
      }
    }

    for (const dir of srcDirs) {
      scanDir(path.join(projectRoot, dir));
    }

    expect(violations).toEqual([]);
  });
});
