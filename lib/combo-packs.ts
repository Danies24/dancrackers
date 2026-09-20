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
}

/** A variety as the card needs it — no itemGroups, so listing every combo's every variety here never triggers the heavier per-variety item fetch. */
export interface ComboPackCardVariety {
  id: string;
  slug: string;
  tierLabel: string;
  sellingPrice: number;
  totalItems: number;
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
 * The home showcase — one card per active combo pack, ordered by starting
 * price ascending (lowest active variety selling_price first). Fallback
 * to display_order on ties (§2).
 */
export async function getActiveComboPacks(): Promise<ComboPackSummary[]> {
  const supabase = createPublicClient();
  const [{ data: packs }, { data: rawVarieties }] = await Promise.all([
    supabase.from("combo_packs").select("*").eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("public_combo_pack_varieties").select("*").order("display_order", { ascending: true }),
  ]);
  const varieties = (rawVarieties ?? []) as unknown as PublicComboVarietyRow[];

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
  for (const item of items) {
    const varietyGroups = groupsByVariety.get(item.variety_id) ?? new Map<string, ComboItemGroup>();
    const categoryName = item.category?.name_en ?? "Other";
    const group = varietyGroups.get(categoryName) ?? { categoryName, items: [] };
    group.items.push({ name_en: item.name_en, name_ta: item.name_ta, unit: item.unit, quantity: item.quantity });
    varietyGroups.set(categoryName, group);
    groupsByVariety.set(item.variety_id, varietyGroups);
  }

  return {
    varietyId: variety.id,
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
      itemGroups: [...(groupsByVariety.get(v.id) ?? new Map()).values()],
    })),
    itemGroups: [...(groupsByVariety.get(variety.id) ?? new Map()).values()],
  };
}
