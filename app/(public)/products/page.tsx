import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getBrowsableShops } from "@/lib/cross-shop";
import { getAllCategoryGroups } from "@/lib/category-groups";
import { getShopPlpSections } from "@/lib/shops";
import { ShopPlpClient } from "@/components/shop/shop-plp-client";
import { getCanonicalUrl } from "@/config/brandConfig";

export const metadata: Metadata = {
  title: "Sivakasi Crackers Price List 2026",
  description:
    "Browse the complete Sivakasi crackers price list for 2026 across every Kolagalam shop, with photos and Tamil names. Build your Diwali enquiry list.",
  alternates: {
    canonical: getCanonicalUrl("/products"),
  },
};

export const revalidate = 120;

/**
 * /products (Swiggy-redesign follow-up) — a shop switcher over the exact
 * same per-shop experience as /s/[shopSlug] (categories, grid/list toggle,
 * its own Under ₹199 section), rather than one flat cross-shop grid. Each
 * shop's "Under ₹199" only ever shows that shop's own items this way, same
 * as the home page's per-shop ₹199 Store sections — never merged.
 *
 * `?q=` is a legacy/search entry point (HomeSearchBar and any old links) —
 * a query that confidently matches a category (e.g. "flower pots") redirects
 * straight to that category's real cross-shop page rather than landing here
 * at all, since that's almost always what someone searching a cracker type
 * actually wants.
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; shop?: string }>;
}) {
  const { q, shop: shopSlugParam } = await searchParams;

  const query = q?.trim();
  if (query) {
    const groups = await getAllCategoryGroups();
    const needle = query.toLowerCase();
    const match = groups.find((g) => {
      const name = g.name_en.toLowerCase();
      return needle.includes(name) || name.includes(needle);
    });
    if (match) redirect(`/category/${match.slug}`);
  }

  const shops = await getBrowsableShops();
  if (shops.length === 0) {
    return <p className="py-16 text-center text-ink-soft">Our catalogue is being updated.</p>;
  }

  const selectedShop = shops.find((s) => s.slug === shopSlugParam) ?? shops[0];
  const sections = await getShopPlpSections(selectedShop.id);
  const hasAnyProducts = sections.some((s) => s.kind !== "combos" && s.products.length > 0);

  return (
    <div>
      <div className="sticky top-16 z-30 flex gap-2 overflow-x-auto border-b border-border bg-surface/95 px-4 py-2 backdrop-blur">
        {shops.map((s) => (
          <Link
            key={s.id}
            href={`/products?shop=${s.slug}`}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap ${
              s.id === selectedShop.id ? "bg-maroon text-on-fill" : "bg-secondary-bg text-ink-soft"
            }`}
          >
            {s.name_en}
          </Link>
        ))}
      </div>

      <h1 className="px-4 pt-4 font-display text-lg font-bold text-ink">{selectedShop.name_en}</h1>

      {!hasAnyProducts ? (
        <p className="py-16 text-center text-ink-soft">Our catalogue for this shop is being updated.</p>
      ) : (
        <ShopPlpClient sections={sections} shopSlug={selectedShop.slug} shopName={selectedShop.name_en} />
      )}
    </div>
  );
}
