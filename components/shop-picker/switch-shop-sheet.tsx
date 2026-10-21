"use client";

import Link from "next/link";
import { Sheet } from "@/components/ui/sheet";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toast";
import { trackEvent } from "@/lib/analytics";
import type { ShopTile as ShopTileData } from "@/lib/shop-picker";
import { ShopTile } from "@/components/shop-picker/shop-tile";

/** "Switch shop" bottom sheet. Navigation only — never touches the cart. */
export function SwitchShopSheet({
  open,
  onClose,
  tiles,
  currentSlug,
}: {
  open: boolean;
  onClose: () => void;
  tiles: ShopTileData[];
  currentSlug: string;
}) {
  const cart = useCart();
  const toast = useToast();
  const hasCart = cart.itemCount > 0 && !!cart.shopSlug;

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="Switch shop">
      <div className="p-6 pt-2">
        <h2 className="font-display text-lg font-semibold text-ink">Switch shop</h2>
        <p className="mt-1 text-sm text-ink-soft">Each shop has its own prices and cart.</p>
        <div className="mt-5 flex flex-wrap gap-5 text-ink">
          {tiles.map((tile) => (
            <ShopTile
              key={tile.slug}
              tile={tile}
              size="sm"
              here={tile.slug === currentSlug}
              onSelect={() => {
                if (tile.slug !== currentSlug) trackEvent("shop_picker_select", { shop: tile.slug, from: "switch_sheet" });
                onClose();
              }}
              onSoonTap={() => {
                trackEvent("shop_picker_soon_tap", { shop: tile.slug });
                toast.show("This shop is opening soon.");
              }}
            />
          ))}
        </div>
        {hasCart && (
          <p className="mt-6 border-t border-border pt-4 text-sm text-ink-soft">
            Cart: {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"} from {cart.shopName} ·{" "}
            <Link href="/cart" onClick={onClose} className="font-semibold text-maroon-ink">
              View cart
            </Link>
          </p>
        )}
      </div>
    </Sheet>
  );
}
