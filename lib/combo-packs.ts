import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * The generated types for public_combo_pack_varieties/public_combo_pack_items
 * (both VIEWs) mark every column nullable — Postgres can't prove a view's
 * output NOT NULL the way it can a table's, same issue already hand-fixed
 * for ProductRow in lib/data.ts. These columns are exactly as non-null in
 * practice as the base tables they're drawn from (the views' inner joins
 * to active combo_packs preserve that).
 */
interface PublicComboVarietyRow {
  id: string;
  shop_id: string;
  combo_pack_id: string;
  slug: string;
  tier_label: string;
  display_order: number;
  selling_price: number;
  total_items: number;
}

interface PublicComboItemRow {
  id: string;
  variety_id: string;
  quantity: number;
  display_order: number;
  name_en: string;
  name_ta: string | null;
  unit: string;
  category: { name_en: string } | null;
  /** Free gift for the customer — counted in supplier cost only, never in the pack's price or item count. */
  is_gift: boolean | null;
}

/** A variety as the card needs it — no itemGroups, so listing every combo's every variety here never triggers the heavier per-variety item fetch. */
export interface ComboPackCardVariety {
  id: string;
  slug: string;
  tierLabel: string;
  sellingPrice: number;
  totalItems: number;
  /** Name of the free gift box that comes with this variety, or null. */
  giftName: string | null;
  /** The gift's worth in rupees (see giftWorth), or null. */
  giftWorth: number | null;
}

export interface ComboPackSummary {
  id: string;
  slug: string;
  varietySlug: string;
  name: string;
  tagline: string | null;
  heroImageUrl: string | null;
  badgeText: string;
  fromPrice: number;
  /** Every active variety, in display order — a single-entry array for a pack that's been collapsed to one tier. */
  varieties: ComboPackCardVariety[];
}

export interface ComboVarietyOption {
  id: string;
  slug: string;
  tierLabel: string;
  sellingPrice: number;
  totalItems: number;
  /** The free gift box that comes with this variety, shown apart from the paid contents. */
  gift: { name_en: string; quantity: number; worth: number | null } | null;
  /** Every sibling's own items, pre-fetched so the Small/Medium/Large switcher
   * can swap instantly client-side with zero extra requests (see
   * components/product/combo-variety-switcher.tsx). */
  itemGroups: ComboItemGroup[];
}

export interface ComboItemGroup {
  categoryName: string;
  items: Array<{ name_en: string; name_ta: string | null; unit: string; quantity: number }>;
}

export interface ComboVarietyDetail {
  varietyId: string;
  shopId: string;
  varietySlug: string;
  tierLabel: string;
  sellingPrice: number;
  totalItems: number;
  comboPackId: string;
  packName: string;
  packSlug: string;
  tagline: string | null;
  heroImageUrl: string | null;
  badgeText: string;
  /** Every variety of this same pack, for the Small/Medium/Large switcher. */
  varieties: ComboVarietyOption[];
  itemGroups: ComboItemGroup[];
}

/**
 * UI price overrides for combo packs (presentation layer).
 * Keyed by combo variety slug or combo pack slug.
 *   - Family Pack: Mini 3k, Small 5k, Medium 7k, Big 10k, Mega 15k
 *   - Morning Blast Pack: 5k
 *   - Night Pack: 6k
 *   - Kids Special Pack: 9k
 */
export const COMBO_UI_PRICE_OVERRIDES: Record<string, number> = {
  "morning-blast-pack": 5000,
  "morning-blast-pack-standard": 5000,
  "night-pack": 6000,
  "night-pack-standard": 6000,
  "kids-special-pack": 9000,
  "kids-special-pack-standard": 9000,
  "family-pack": 3000,
  "family-pack-mini": 3000,
  "family-pack-small": 5000,
  "family-pack-medium": 7000,
  "family-pack-big": 10000,
  "family-pack-large": 15000,
  "family-pack-mega": 15000,
};

export function getComboUiPrice(slug: string, defaultPrice: number): number {
  return COMBO_UI_PRICE_OVERRIDES[slug] ?? defaultPrice;
}

/**
 * What a free gift is "worth" to the customer: its own shop price × quantity,
 * rounded DOWN to the nearest ₹10 so the claim is never overstated. The one
 * rule shared by the pack page, the pack card and the order text.
 */
export function giftWorth(price: number | null | undefined, quantity = 1): number | null {
  if (price == null) return null;
  const worth = Math.floor((price * quantity) / 10) * 10;
  return worth > 0 ? worth : null;
}

/** Gift name -> shop price, from the public product view (names are unique within a shop). */
async function fetchGiftPrices(shopId: string | null, names: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  if (!shopId || names.length === 0) return prices;
  const supabase = createPublicClient();
  const { data } = await supabase.from("public_products").select("name_en, price").eq("shop_id", shopId).in("name_en", names);
  for (const row of data ?? []) if (row.name_en && row.price != null) prices.set(row.name_en, Number(row.price));
  return prices;
}

/**
 * The home showcase — one card per active combo pack, ordered by starting
 * price ascending (lowest active variety selling_price first). Fallback
 * to display_order on ties (§2).
 */
export async function getActiveComboPacks(): Promise<ComboPackSummary[]> {
  const supabase = createPublicClient();
  const [{ data: packs }, { data: rawVarieties }, { data: rawGifts }] = await Promise.all([
    supabase.from("combo_packs").select("*").eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("public_combo_pack_varieties").select("*").order("display_order", { ascending: true }),
    supabase.from("public_combo_pack_items").select("variety_id, name_en").eq("is_gift", true),
  ]);
  const varieties = (rawVarieties ?? []) as unknown as PublicComboVarietyRow[];
  const giftNameByVariety = new Map<string, string>();
  for (const g of (rawGifts ?? []) as unknown as Array<{ variety_id: string; name_en: string }>) {
    giftNameByVariety.set(g.variety_id, g.name_en);
  }
  const giftPrices = await fetchGiftPrices(varieties[0]?.shop_id ?? null, [...new Set(giftNameByVariety.values())]);

  const varietiesByPack = new Map<string, PublicComboVarietyRow[]>();
  for (const v of varieties) {
    const list = varietiesByPack.get(v.combo_pack_id) ?? [];
    list.push(v);
    varietiesByPack.set(v.combo_pack_id, list);
  }

  return (packs ?? [])
    .map((pack) => {
      const packVarieties = varietiesByPack.get(pack.id) ?? [];
      const defaultVariety = packVarieties[0];
      if (!defaultVariety) return null;
      const varietiesList = packVarieties.map((v) => ({
        id: v.id,
        slug: v.slug,
        tierLabel: v.tier_label,
        sellingPrice: getComboUiPrice(v.slug, v.selling_price),
        totalItems: v.total_items,
        giftName: giftNameByVariety.get(v.id) ?? null,
        giftWorth: giftWorth(giftPrices.get(giftNameByVariety.get(v.id) ?? "")),
      }));
      const fromPrice = Math.min(...varietiesList.map((v) => v.sellingPrice));
      return {
        id: pack.id,
        slug: pack.slug,
        varietySlug: defaultVariety.slug,
        name: pack.name,
        tagline: pack.tagline,
        heroImageUrl: pack.hero_image_url,
        badgeText: pack.badge_text,
        fromPrice,
        display_order: pack.display_order,
        varieties: varietiesList,
      };
    })
    .filter((p): p is ComboPackSummary & { display_order: number } => p !== null)
    .sort((a, b) => {
      if (a.fromPrice !== b.fromPrice) {
        return a.fromPrice - b.fromPrice;
      }
      return a.display_order - b.display_order;
    });
}

/**
 * Every active variety's slug — feeds /product/[slug]'s generateStaticParams
 * so a combo pack's own detail pages are pre-rendered at build/deploy time
 * too, same as regular products (§ getAllProductSlugs in lib/data.ts).
 */
export async function getAllComboVarietySlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("public_combo_pack_varieties").select("slug");
  return (data ?? []).map((v) => v.slug).filter((slug): slug is string => slug != null);
}

/**
 * Resolves a combo variety by its own slug — the fallback getProductBySlug()
 * reaches for when a plain products lookup misses (see
 * supabase/migrations/20260918000001_combo_packs.sql for why a variety is
 * independently addressable rather than nested under the pack's slug).
 */
export async function getComboVarietyBySlug(slug: string): Promise<ComboVarietyDetail | null> {
  const supabase = createPublicClient();
  const { data: rawVariety } = await supabase.from("public_combo_pack_varieties").select("*").eq("slug", slug).maybeSingle();
  if (!rawVariety) return null;
  const variety = rawVariety as unknown as PublicComboVarietyRow;

  const [{ data: pack }, { data: rawSiblingVarieties }] = await Promise.all([
    supabase.from("combo_packs").select("*").eq("id", variety.combo_pack_id).maybeSingle(),
    supabase
      .from("public_combo_pack_varieties")
      .select("id, slug, tier_label, selling_price, total_items")
      .eq("combo_pack_id", variety.combo_pack_id)
      .order("display_order", { ascending: true }),
  ]);

  if (!pack) return null;
  const siblingVarieties = (rawSiblingVarieties ?? []) as unknown as PublicComboVarietyRow[];

  // Every sibling's items fetched together in one query — this is what lets
  // the Small/Medium/Large switcher swap tiers instantly client-side (no
  // per-click Supabase round-trip / full page navigation).
  const { data: rawItems } = await supabase
    .from("public_combo_pack_items")
    .select("*")
    .in(
      "variety_id",
      siblingVarieties.map((v) => v.id),
    )
    .order("display_order", { ascending: true });
  const items = (rawItems ?? []) as unknown as PublicComboItemRow[];

  const groupsByVariety = new Map<string, Map<string, ComboItemGroup>>();
  const giftByVariety = new Map<string, { name_en: string; quantity: number; worth: number | null }>();
  for (const item of items) {
    if (item.is_gift) {
      giftByVariety.set(item.variety_id, { name_en: item.name_en, quantity: item.quantity, worth: null });
      continue;
    }
    const varietyGroups = groupsByVariety.get(item.variety_id) ?? new Map<string, ComboItemGroup>();
    const categoryName = item.category?.name_en ?? "Other";
    const group = varietyGroups.get(categoryName) ?? { categoryName, items: [] };
    group.items.push({ name_en: item.name_en, name_ta: item.name_ta, unit: item.unit, quantity: item.quantity });
    varietyGroups.set(categoryName, group);
    groupsByVariety.set(item.variety_id, varietyGroups);
  }

  const giftPrices = await fetchGiftPrices(variety.shop_id, [...new Set([...giftByVariety.values()].map((g) => g.name_en))]);
  for (const gift of giftByVariety.values()) gift.worth = giftWorth(giftPrices.get(gift.name_en), gift.quantity);

  return {
    varietyId: variety.id,
    shopId: variety.shop_id,
    varietySlug: variety.slug,
    tierLabel: variety.tier_label,
    sellingPrice: getComboUiPrice(variety.slug, variety.selling_price),
    totalItems: variety.total_items,
    comboPackId: pack.id,
    packName: pack.name,
    packSlug: pack.slug,
    tagline: pack.tagline,
    heroImageUrl: pack.hero_image_url,
    badgeText: pack.badge_text,
    varieties: siblingVarieties.map((v) => ({
      id: v.id,
      slug: v.slug,
      tierLabel: v.tier_label,
      sellingPrice: getComboUiPrice(v.slug, v.selling_price),
      totalItems: v.total_items,
      gift: giftByVariety.get(v.id) ?? null,
      itemGroups: [...(groupsByVariety.get(v.id) ?? new Map()).values()],
    })),
    itemGroups: [...(groupsByVariety.get(variety.id) ?? new Map()).values()],
  };
}
