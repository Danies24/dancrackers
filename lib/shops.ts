import "server-only";
import { headers } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { rankProducts } from "@/lib/ranking";
import { getActiveComboPacks, getComboVarietyBySlug } from "@/lib/combo-packs";
import { SRI_RAM_SHOP } from "@/lib/cart";
import { buildShopPlpSections, type ShopPlpSection } from "@/lib/shop-plp-sections";
import type { Database } from "@/types/database";
import type { CategoryRow, ProductWithCategory } from "@/lib/data";

export type ShopRow = Database["public"]["Tables"]["shops"]["Row"];

const PREVIEW_TOKEN_PATTERN = /^[0-9a-f]{16}$/;

/**
 * Cart and enquiry submission are still single-shop and hardcoded to Sri
 * Ram (multi-shop spec §6/§8 — one-shop-per-cart and shop agents aren't
 * built yet). A shop can be made publicly visible (`status = 'active'`)
 * before that work lands, to let it be browsed/shown to the shop owner —
 * this is the single place that decides whether it can actually be
 * checked out yet, so the shop page's "not open yet" notice and the
 * enquiry route's rejection can never drift apart.
 */
const ORDERABLE_SHOP_SLUGS = new Set(["sri-ram-crackers"]);
export function isShopOrderable(shopSlug: string): boolean {
  return ORDERABLE_SHOP_SLUGS.has(shopSlug);
}

export interface ShopRouteResult {
  shop: ShopRow;
  /** True only when this shop is `hidden` and was unlocked by a matching `?preview=` token. */
  isPreview: boolean;
}

/**
 * Resolves a shop for a /s/[shopSlug] request (multi-shop spec §5.3). A
 * `hidden` shop is invisible to the public client (RLS: `status <> 'hidden'`)
 * — the only way to reach one is a preview_token that matches exactly, which
 * has to be checked through the admin client since the public client can
 * never even select the row to compare against. An invalid/missing token on
 * a hidden shop is indistinguishable from "shop doesn't exist" to the
 * caller, by design — never leaks whether a hidden slug exists.
 */
export async function getShopForRoute(slug: string, previewToken?: string | null): Promise<ShopRouteResult | null> {
  const publicClient = createPublicClient();
  const { data: shop, error } = await publicClient.from("shops").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (shop) return { shop, isPreview: false };

  if (!previewToken || !PREVIEW_TOKEN_PATTERN.test(previewToken)) return null;

  const admin = createAdminClient();
  const { data: hiddenShop, error: adminError } = await admin
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .eq("status", "hidden")
    .eq("preview_token", previewToken)
    .maybeSingle();
  if (adminError) throw adminError;
  if (!hiddenShop) return null;
  return { shop: hiddenShop, isPreview: true };
}

/**
 * The one call every /s/[shopSlug]* route (layout and every page under it)
 * should use to resolve its shop — reads the preview token proxy.ts already
 * resolved from ?preview= or the fallback cookie into a request header (see
 * proxy.ts for why: layouts don't receive `searchParams`, and a
 * newly-`Set-Cookie`'d value isn't visible within that same request either).
 */
export async function getShopForCurrentRequest(shopSlug: string): Promise<ShopRouteResult | null> {
  const headerList = await headers();
  const previewToken = headerList.get("x-kg-preview-token") ?? undefined;
  return getShopForRoute(shopSlug, previewToken);
}

/** Looked up once per request and cheap to re-fetch — used by admin/agent routes that only have a slug. */
export async function getShopBySlug(slug: string): Promise<ShopRow | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("shops").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getShopCatalogue(shopId: string): Promise<ProductWithCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("public_products")
    .select("*")
    .eq("shop_id", shopId)
    .eq("status", "active")
    .not("price", "is", null)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return rankProducts((data ?? []) as unknown as ProductWithCategory[]);
}

export async function getShopCategoryWithCounts(shopId: string) {
  const supabase = createPublicClient();
  const [{ data: categories, error }, products] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("shop_id", shopId)
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    getShopCatalogue(shopId),
  ]);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const p of products) {
    if (!p.category_id) continue;
    counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  }
  return (categories ?? []).map((c) => ({ ...c, productCount: counts.get(c.id) ?? 0 }));
}

export async function getShopActiveCategories(shopId: string): Promise<CategoryRow[]> {
  const categories = await getShopCategoryWithCounts(shopId);
  return categories.filter((c) => c.productCount > 0);
}

export async function getShopCategoryBySlug(shopId: string, categorySlug: string) {
  const categories = await getShopActiveCategories(shopId);
  return categories.find((c) => c.slug === categorySlug) ?? null;
}

/**
 * Mirrors lib/data.ts's getProductBySlug() combo-pack fallback, scoped to a
 * shop. Combo packs are Sri Ram-only for now (multi-shop spec §5.6) — the
 * shopId check on the combo result is what keeps a combo slug from
 * resolving on another shop's product page once other shops get combos too.
 */
export async function getShopProductBySlug(shop: ShopRow, slug: string): Promise<ProductWithCategory | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("public_products")
    .select("*")
    .eq("shop_id", shop.id)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as unknown as ProductWithCategory;

  const combo = await getComboVarietyBySlug(slug);
  if (!combo || combo.shopId !== shop.id) return null;

  return {
    id: combo.varietyId,
    sku: `COMBO-${combo.varietySlug.toUpperCase()}`,
    slug: combo.varietySlug,
    name_en: `${combo.packName} — ${combo.tierLabel}`,
    name_ta: null,
    category_id: "",
    category: { id: "", slug: "", name_en: "Combo Pack", name_ta: null },
    shop_id: shop.id,
    shop_slug: shop.slug,
    pack: null,
    unit: "pack",
    status: "active",
    is_bestseller: false,
    is_featured: false,
    min_qty: 1,
    image_url: combo.heroImageUrl,
    image_urls: [],
    video_url: null,
    description: null,
    display_order: 0,
    price: combo.sellingPrice,
    is_discountable: false,
    mrp: null,
    discount_percent: null,
    combo,
  };
}

export async function getShopProductSlugs(shopId: string): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("public_products")
    .select("slug")
    .eq("shop_id", shopId)
    .eq("status", "active")
    .not("price", "is", null);
  if (error) throw error;
  return (data ?? []).map((p) => p.slug as string);
}

/**
 * The home page's "Our Shops" rail (multi-shop spec §5.2) — `hidden` shops
 * never appear here at all (RLS already restricts the public client to
 * `status != 'hidden'`, so this needs no extra filtering), each with its
 * live active-product count for the card's meta line.
 */
export async function getShopsForHomeRail(): Promise<Array<ShopRow & { productCount: number }>> {
  const supabase = createPublicClient();
  const { data: shops, error } = await supabase.from("shops").select("*").order("display_order", { ascending: true });
  if (error) throw error;

  const counts = await Promise.all(
    (shops ?? []).map(async (shop) => {
      const { count } = await supabase
        .from("public_products")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shop.id)
        .eq("status", "active")
        .not("price", "is", null);
      return [shop.id, count ?? 0] as const;
    }),
  );
  const countById = new Map(counts);

  return (shops ?? []).map((shop) => ({ ...shop, productCount: countById.get(shop.id) ?? 0 }));
}

/**
 * The shop PLP's bucketed section list (Swiggy-redesign plan) — one
 * getShopCatalogue() fetch feeds every section via buildShopPlpSections()'s
 * pure bucketing, rather than one query per section. Combo packs are still
 * Sri Ram-only at the data layer (combo_packs has no shop_id column yet —
 * see lib/combo-packs.ts) — gated here so another shop's PLP never asks for
 * them at all.
 */
export async function getShopPlpSections(shopId: string): Promise<ShopPlpSection[]> {
  const supabase = createPublicClient();
  const [products, { data: categories, error }, combos] = await Promise.all([
    getShopCatalogue(shopId),
    supabase
      .from("categories")
      .select("*")
      .eq("shop_id", shopId)
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    shopId === SRI_RAM_SHOP.id ? getActiveComboPacks() : Promise.resolve([]),
  ]);
  if (error) throw error;

  return buildShopPlpSections(products, categories ?? [], combos);
}

/**
 * Per-shop generalization of lib/data.ts's getMaxActiveDiscountPercent() —
 * the real, currently-active highest discount for one shop, never a stored/
 * stale value. Always 0 for a net_markup shop (Bullet): discount_percent is
 * null-by-trigger for every net_markup product (see
 * compute_product_customer_price() in supabase/migrations/20260922000001),
 * so a caller must treat 0 as "hide the discount badge," never render it as
 * a literal "0% OFF".
 */
export async function getShopMaxActiveDiscountPercent(shopId: string): Promise<number> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("public_products")
    .select("discount_percent")
    .eq("shop_id", shopId)
    .eq("status", "active")
    .not("discount_percent", "is", null)
    .order("discount_percent", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return 0;
  return Number(data.discount_percent ?? 0);
}
