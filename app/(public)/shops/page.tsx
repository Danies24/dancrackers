import type { Metadata } from "next";
import { getShopPickerCards, isShopOrderable } from "@/lib/shops";
import { toShopTiles } from "@/lib/shop-picker";
import { ShopPicker } from "@/components/shop-picker/shop-picker";
import { getCanonicalUrl } from "@/config/brandConfig";

export const metadata: Metadata = {
  title: { absolute: "Choose a Sivakasi shop — Kolagalam" },
  alternates: { canonical: getCanonicalUrl("/shops") },
};

export const revalidate = 300;

export default async function ShopsPage() {
  const cards = await getShopPickerCards();
  return <ShopPicker tiles={toShopTiles(cards, isShopOrderable)} />;
}
