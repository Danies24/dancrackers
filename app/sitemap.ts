import type { MetadataRoute } from "next";
import { getActiveCategories, getCatalogue } from "@/lib/data";

const STATIC_PAGES = [
  "",
  "/products",
  "/how-it-works",
  "/safety",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/compliance",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const [categories, products] = await Promise.all([
    getActiveCategories().catch(() => []),
    getCatalogue().catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${siteUrl}/products/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteUrl}/product/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
