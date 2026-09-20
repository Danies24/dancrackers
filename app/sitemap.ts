import type { MetadataRoute } from "next";
import { getActiveCategories, getCatalogue } from "@/lib/data";
import { getCanonicalUrl } from "@/config/brandConfig";

const STATIC_PATHS = [
  "",
  "/products",
  "/how-it-works",
  "/safety",
  "/about",
  "/contact",
  "/faq",
  "/compliance",
  "/terms",
  "/privacy",
  "/shipping",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getActiveCategories().catch(() => []),
    getCatalogue().catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: getCanonicalUrl(path),
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((c) => Boolean(c.slug))
    .map((c) => ({
      url: getCanonicalUrl(`/products/${c.slug}`),
      ...(c.created_at ? { lastModified: new Date(c.created_at) } : {}),
    }));

  const productEntries: MetadataRoute.Sitemap = products
    .filter((p) => Boolean(p.slug) && p.status === "active")
    .map((p) => ({
      url: getCanonicalUrl(`/product/${p.slug}`),
    }));

  // Deduplicate and return clean array of absolute URLs
  const seen = new Set<string>();
  const allEntries: MetadataRoute.Sitemap = [];

  for (const entry of [...staticEntries, ...categoryEntries, ...productEntries]) {
    if (!seen.has(entry.url)) {
      seen.add(entry.url);
      allEntries.push(entry);
    }
  }

  return allEntries;
}
