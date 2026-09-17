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

export interface ComboPackSummary {
  id: string;
  slug: string;
  varietySlug: string;
  name: string;
  tagline: string | null;
  heroImageUrl: string | null;
  badgeText: string;
  fromPrice: number;
}

export interface ComboVarietyOption {
  id: string;
  slug: string;
  tierLabel: string;
  sellingPrice: number;
  totalItems: number;
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
 * The home showcase — one card per active combo pack, priced from its
 * cheapest variety ("From ₹X"). Combo packs get their own dedicated
 * showcase (§6.2) and are deliberately never mixed into getCatalogue()'s
 * regular grid.
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
      const cheapest = (varietiesByPack.get(pack.id) ?? [])[0];
      if (!cheapest) return null;
      return {
        id: pack.id,
        slug: pack.slug,
        varietySlug: cheapest.slug,
        name: pack.name,
        tagline: pack.tagline,
        heroImageUrl: pack.hero_image_url,
        badgeText: pack.badge_text,
        fromPrice: cheapest.selling_price,
      };
    })
    .filter((p): p is ComboPackSummary => p !== null);
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

  const [{ data: pack }, { data: rawSiblingVarieties }, { data: rawItems }] = await Promise.all([
    supabase.from("combo_packs").select("*").eq("id", variety.combo_pack_id).maybeSingle(),
    supabase
      .from("public_combo_pack_varieties")
      .select("id, slug, tier_label, selling_price, total_items")
      .eq("combo_pack_id", variety.combo_pack_id)
      .order("display_order", { ascending: true }),
    supabase
      .from("public_combo_pack_items")
      .select("*")
      .eq("variety_id", variety.id)
      .order("display_order", { ascending: true }),
  ]);

  if (!pack) return null;
  const siblingVarieties = (rawSiblingVarieties ?? []) as unknown as PublicComboVarietyRow[];
  const items = (rawItems ?? []) as unknown as PublicComboItemRow[];

  const groups = new Map<string, ComboItemGroup>();
  for (const item of items) {
    const categoryName = item.category?.name_en ?? "Other";
    const group = groups.get(categoryName) ?? { categoryName, items: [] };
    group.items.push({ name_en: item.name_en, name_ta: item.name_ta, unit: item.unit, quantity: item.quantity });
    groups.set(categoryName, group);
  }

  return {
    varietyId: variety.id,
    varietySlug: variety.slug,
    tierLabel: variety.tier_label,
    sellingPrice: variety.selling_price,
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
      sellingPrice: v.selling_price,
      totalItems: v.total_items,
    })),
    itemGroups: [...groups.values()],
  };
}
