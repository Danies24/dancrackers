/**
 * Pure encode/decode for the shareable-cart link format:
 *   /cart/shared?s=<shop-slug>&i=<slug>.<qty>,<slug>.<qty>,...
 * No prices or personal data ever enter this format — the /cart/shared page
 * re-resolves every slug against the live catalogue and recomputes totals
 * itself (see app/(public)/cart/shared/page.tsx). A combo-pack variety has
 * its own distinct slug already, so no separate "variant id" is needed.
 */

export interface ShareCartItem {
  slug: string;
  qty: number;
}

/** Above this length, callers should persist the cart server-side (lib/cart-share-store.ts) and link by id instead. */
export const SHARE_URL_LENGTH_LIMIT = 1800;

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const MAX_ITEMS = 300;
const MAX_QTY = 999;

export function encodeCartItems(items: ShareCartItem[]): string {
  return items
    .filter((i) => SLUG_PATTERN.test(i.slug) && Number.isInteger(i.qty) && i.qty > 0)
    .map((i) => `${i.slug}.${Math.min(i.qty, MAX_QTY)}`)
    .join(",");
}

/** Malformed pairs (bad slug, non-numeric/zero/negative qty) are silently dropped, never thrown. */
export function decodeCartItems(raw: string | null | undefined): ShareCartItem[] {
  if (!raw) return [];
  const pairs = raw.split(",").slice(0, MAX_ITEMS);
  const items: ShareCartItem[] = [];
  for (const pair of pairs) {
    const match = /^([a-z0-9-]+)\.(\d+)$/.exec(pair.trim());
    if (!match) continue;
    const slug = match[1];
    const qty = Number(match[2]);
    if (!SLUG_PATTERN.test(slug) || !Number.isInteger(qty) || qty <= 0) continue;
    items.push({ slug, qty: Math.min(qty, MAX_QTY) });
  }
  return items;
}

/**
 * Builds the query string by hand rather than via URLSearchParams — every
 * character encodeCartItems can produce ([a-z0-9-.,]) is already safe
 * unencoded in a query string, and URLSearchParams would otherwise percent-
 * encode every "," as "%2C", tripling that part of the link for no reason.
 */
export function buildShareUrl(baseUrl: string, shopSlug: string, items: ShareCartItem[]): string {
  return `${baseUrl.replace(/\/+$/, "")}/cart/shared?s=${encodeURIComponent(shopSlug)}&i=${encodeCartItems(items)}`;
}

export function exceedsShareUrlLimit(url: string): boolean {
  return url.length > SHARE_URL_LENGTH_LIMIT;
}

export function buildShortShareUrl(baseUrl: string, id: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/cart/shared?id=${encodeURIComponent(id)}`;
}
