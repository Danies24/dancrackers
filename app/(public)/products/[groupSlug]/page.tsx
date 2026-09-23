import { permanentRedirect } from "next/navigation";

/**
 * Superseded by /category/[categorySlug] (Swiggy-redesign plan, per-shop-
 * grouped carousels instead of one flat grid) — 301'd rather than kept
 * alive, same pattern already used for old shop URLs → /s/[shopSlug].
 */
export default async function LegacyGroupProductsPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  permanentRedirect(`/category/${groupSlug}`);
}
