import type { MetadataRoute } from "next";
import { getBrowsableShops, getCrossShopProducts } from "@/lib/cross-shop";
import { createPublicClient } from "@/lib/supabase/public";
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
  const [shops, products] = await Promise.all([
    getBrowsableShops().catch(() => []),
    getCrossShopProducts({}).catch(() => []),
  ]);

  const supabase = createPublicClient();
  const { data: featuredGroups } = await supabase
    .from("category_groups")
    .select("slug")
    .eq("is_featured", true)
    .order("display_order", { ascending: true });

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: getCanonicalUrl(path),
  }));

  const shopEntries: MetadataRoute.Sitemap = shops
    .filter((s) => Boolean(s.slug))
    .map((s) => ({
      url: getCanonicalUrl(`/s/${s.slug}`),
      ...(s.updated_at ? { lastModified: new Date(s.updated_at) } : {}),
    }));

  const groupEntries: MetadataRoute.Sitemap = (featuredGroups ?? [])
    .filter((g) => Boolean(g.slug))
    .map((g) => ({
      url: getCanonicalUrl(`/category/${g.slug}`),
    }));

  const productEntries: MetadataRoute.Sitemap = products
    .filter((p) => Boolean(p.slug) && Boolean(p.shop_slug) && p.status === "active")
    .map((p) => ({
      url: getCanonicalUrl(`/s/${p.shop_slug}/p/${p.slug}`),
    }));

  // Deduplicate and return clean array of absolute URLs
  const seen = new Set<string>();
  const allEntries: MetadataRoute.Sitemap = [];

  for (const entry of [...staticEntries, ...shopEntries, ...groupEntries, ...productEntries]) {
    if (!seen.has(entry.url)) {
      seen.add(entry.url);
      allEntries.push(entry);
    }
  }

  return allEntries;
}
