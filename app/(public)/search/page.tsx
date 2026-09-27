import { Metadata } from "next";
import { HomeSearchBar } from "@/components/marketing/home-search-bar";
import { ShopShowcaseCard } from "@/components/shop/shop-showcase-card";
import { CategoryGroupTile } from "@/components/shop/category-group-tile";
import { getShopsForHomeShowcase } from "@/lib/shops";
import { getAllCategoryGroups, getCategoryGroupIdByCategoryId, type CategoryGroupRow } from "@/lib/category-groups";
import { getCrossShopProducts } from "@/lib/cross-shop";
import { getCanonicalUrl } from "@/config/brandConfig";

export const metadata: Metadata = {
  title: "Search Products",
  description: "Search for Sivakasi crackers and discover our shops.",
  alternates: {
    canonical: getCanonicalUrl("/search"),
  },
};

export const revalidate = 300;

const NIGHT_PINNED_SLUGS = ["sparklers", "ground-chakkars", "flower-pots"];
const DAY_PINNED_SLUGS = ["paper-bombs", "bombs", "sound-crackers"];

function orderCategoryGroups(groups: CategoryGroupRow[], pinnedSlugs: string[], countByGroupId: Map<string, number>): CategoryGroupRow[] {
  const bySlug = new Map(groups.map((g) => [g.slug, g]));
  const pinned = pinnedSlugs.map((slug) => bySlug.get(slug)).filter((g): g is CategoryGroupRow => !!g);
  const pinnedIds = new Set(pinned.map((g) => g.id));
  const rest = groups
    .filter((g) => !pinnedIds.has(g.id))
    .sort((a, b) => (countByGroupId.get(b.id) ?? 0) - (countByGroupId.get(a.id) ?? 0));
  return [...pinned, ...rest].slice(0, 9);
}

export default async function SearchPage() {
  const [shopCards, allCategoryGroups, categoryIdToGroupId, crossShopProducts] = await Promise.all([
    getShopsForHomeShowcase(),
    getAllCategoryGroups(),
    getCategoryGroupIdByCategoryId(),
    getCrossShopProducts({}),
  ]);

  const countByGroupId = new Map<string, number>();
  for (const p of crossShopProducts) {
    const groupId = categoryIdToGroupId.get(p.category.id);
    if (!groupId) continue;
    countByGroupId.set(groupId, (countByGroupId.get(groupId) ?? 0) + 1);
  }

  const nightCategoryGroups = orderCategoryGroups(
    allCategoryGroups.filter((g) => g.time_of_day === "night"),
    NIGHT_PINNED_SLUGS,
    countByGroupId,
  );
  const dayCategoryGroups = orderCategoryGroups(
    allCategoryGroups.filter((g) => g.time_of_day === "day"),
    DAY_PINNED_SLUGS,
    countByGroupId,
  );

  return (
    <div className="bg-cream min-h-screen">
      <div className="px-4 py-6">
        <HomeSearchBar />
      </div>

      {shopCards.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">Our Shops</h2>
          </div>
          <div className="flex flex-col gap-4">
            {shopCards.map((card) => (
              <ShopShowcaseCard key={card.shop.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {(nightCategoryGroups.length > 0 || dayCategoryGroups.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">Shop by category</h2>
          </div>

          {nightCategoryGroups.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 font-display text-base font-bold text-ink">🌙 Night Crackers</h3>
              <div className="grid grid-cols-3 gap-x-3 gap-y-5">
                {nightCategoryGroups.map((group) => (
                  <CategoryGroupTile key={group.id} group={group} />
                ))}
              </div>
            </div>
          )}

          {dayCategoryGroups.length > 0 && (
            <div>
              <h3 className="mb-4 font-display text-base font-bold text-ink">☀️ Day Crackers</h3>
              <div className="grid grid-cols-3 gap-x-3 gap-y-5">
                {dayCategoryGroups.map((group) => (
                  <CategoryGroupTile key={group.id} group={group} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
