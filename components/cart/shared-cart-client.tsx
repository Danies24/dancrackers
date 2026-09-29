"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Stepper } from "@/components/ui/stepper";
import { ShareCartButton } from "@/components/cart/share-cart-button";
import { GurusamyDeliveryNotice } from "@/components/cart/gurusamy-delivery-notice";
import { computeTotals } from "@/lib/pricing";
import { getShopDeliveryConfig, isGurusamyShop } from "@/config/deliveryConfig";
import { formatRupees, formatUnit } from "@/lib/format";
import type { CartShop } from "@/lib/cart";

export interface SharedCartEditableLine {
  productId: string;
  slug: string;
  sku: string;
  name_en: string;
  name_ta: string | null;
  image_url: string | null;
  unit: string;
  price: number;
  isDiscountable: boolean;
  mrp: number | null;
  categoryName: string;
  qty: number;
}

function groupByCategory(lines: SharedCartEditableLine[]) {
  const groups = new Map<string, SharedCartEditableLine[]>();
  for (const line of lines) {
    if (!groups.has(line.categoryName)) groups.set(line.categoryName, []);
    groups.get(line.categoryName)!.push(line);
  }
  return [...groups.entries()].map(([name, groupLines]) => ({ name, lines: groupLines }));
}

/**
 * The interactive /cart/shared view — edit quantities, remove a line,
 * re-share the (possibly now-edited) cart, or load it into your own cart /
 * send an enquiry. Edits are local view state only: nothing is written to
 * the visitor's real cart (useCart()/localStorage) until they explicitly
 * load it or send the enquiry — exactly like /cart never touches anything
 * until checkout. computeTotals/getShopDeliveryConfig are the same
 * functions app/(public)/cart/page.tsx uses, so the numbers can never
 * drift apart between the two pages.
 */
export function SharedCartView({
  shop,
  initialLines,
  droppedCount,
}: {
  shop: CartShop;
  initialLines: SharedCartEditableLine[];
  droppedCount: number;
}) {
  const router = useRouter();
  const { items, shopId, loadItems } = useCart();
  const { show } = useToast();
  const [lines, setLines] = useState(initialLines);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"load" | "enquiry" | null>(null);

  const deliveryConfig = getShopDeliveryConfig(shop.slug);
  const totals = computeTotals(
    lines.map((l) => ({ price: l.price, quantity: l.qty, isDiscountable: l.isDiscountable, mrp: l.mrp })),
    shop.slug,
  );
  const totalQty = lines.reduce((sum, l) => sum + l.qty, 0);
  const groups = groupByCategory(lines);

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      setLines((prev) => prev.filter((l) => l.productId !== productId));
      return;
    }
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, qty } : l)));
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  const cartIsEmpty = items.length === 0;
  const sameShop = !cartIsEmpty && shopId === shop.id;

  function finish(mode: "merge" | "replace", action: "load" | "enquiry") {
    loadItems(
      lines.map((l) => ({ productId: l.productId, sku: l.sku, price: l.price, qty: l.qty })),
      shop,
      mode,
    );
    setConfirmOpen(false);
    setPendingAction(null);
    if (action === "enquiry") {
      router.push("/enquiry");
    } else {
      show("Loaded into your cart!");
    }
  }

  function startAction(action: "load" | "enquiry") {
    if (lines.length === 0) return;
    if (cartIsEmpty) {
      finish("replace", action);
      return;
    }
    setPendingAction(action);
    setConfirmOpen(true);
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-maroon-tint text-3xl">🛒</div>
        <h1 className="font-display text-xl font-semibold text-ink">Nothing left in this shared cart</h1>
        <p className="text-sm text-ink-soft">You removed every item — browse the shop to add something instead.</p>
        <Link href={`/s/${shop.slug}`}>
          <Button>Browse {shop.name}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-40">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Shared Cart <span className="text-base font-normal text-muted">({totalQty} items)</span>
      </h1>
      <div className="mt-1 flex items-center justify-between gap-3">
        <Link href={`/s/${shop.slug}`} className="inline-block text-sm font-medium text-maroon-ink hover:underline">
          from {shop.name} →
        </Link>
        <ShareCartButton
          shopSlug={shop.slug}
          lines={lines.map((l) => ({ slug: l.slug, qty: l.qty, name_en: l.name_en, name_ta: l.name_ta }))}
        />
      </div>

      {droppedCount > 0 && (
        <p className="mt-3 rounded-md bg-gold-tint px-3 py-2 text-xs font-medium text-gold-ink">
          {droppedCount} item{droppedCount === 1 ? "" : "s"} in this cart {droppedCount === 1 ? "is" : "are"} no longer
          available and {droppedCount === 1 ? "was" : "were"} left out.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.name}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{group.name}</h2>
            <div className="divide-y divide-border rounded-lg border border-border bg-surface">
              {group.lines.map((line) => (
                <div key={line.productId} className="flex gap-3 p-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-cream">
                    {line.image_url ? (
                      <Image src={line.image_url} alt={line.name_en} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display font-semibold text-maroon-ink">
                        {line.name_en.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">{line.name_en}</p>
                    <p className="tabular-nums text-xs text-muted">
                      {formatRupees(line.price)} per {formatUnit(line.unit)}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <Stepper
                        value={line.qty}
                        onIncrement={() => updateQty(line.productId, line.qty + 1)}
                        onDecrement={() => updateQty(line.productId, line.qty - 1)}
                        label={line.name_en}
                      />
                      <span className="tabular-nums text-sm font-bold text-ink">
                        {formatRupees(line.price * line.qty)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.productId)}
                    aria-label={`Remove ${line.name_en}`}
                    className="self-start text-muted hover:text-red-ink"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4">
        <div className="flex justify-between py-0.5 text-sm text-muted">
          <span>Item subtotal</span>
          <span className="tabular-nums">{formatRupees(totals.subtotal)}</span>
        </div>
        {deliveryConfig.packaging.enabled && (
          <div className="flex justify-between py-0.5 text-sm text-ink-soft">
            <span>Packaging charge ({deliveryConfig.packaging.percent}%)</span>
            <span className="tabular-nums">
              {totals.packagingCharge === 0 ? (
                <span className="font-semibold text-teal-ink">Free</span>
              ) : (
                formatRupees(totals.packagingCharge)
              )}
            </span>
          </div>
        )}
        <div className="flex justify-between py-0.5 text-sm text-ink-soft">
          <span>Delivery charge</span>
          <span className="tabular-nums">
            {totals.deliveryCharge === 0 ? (
              <span className="font-semibold text-teal-ink">Free</span>
            ) : (
              formatRupees(totals.deliveryCharge)
            )}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <span className="font-semibold text-ink">Total</span>
          <span className="tabular-nums text-2xl font-bold text-ink">{formatRupees(totals.grandTotal)}</span>
        </div>
      </div>

      {isGurusamyShop(shop.slug) && (
        <div className="mt-3">
          <GurusamyDeliveryNotice subtotal={totals.subtotal} />
        </div>
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        {/* pr-20 keeps both buttons clear of the floating WhatsApp button (fixed
            bottom-right, z-50 — components/layout/floating-whatsapp.tsx), which
            otherwise sits on top of "Send enquiry"'s right edge on mobile. */}
        <div className="mx-auto flex max-w-3xl gap-2 pr-20 md:pr-0">
          <Button size="full" variant="secondary" onClick={() => startAction("load")}>
            Load into my cart
          </Button>
          <Button size="full" onClick={() => startAction("enquiry")}>
            Send enquiry →
          </Button>
        </div>
      </div>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} ariaLabel="Load shared cart">
        <div className="p-6">
          {sameShop ? (
            <>
              <h2 className="font-display text-lg font-semibold text-ink">Merge or replace?</h2>
              <p className="mt-3 text-sm text-ink-soft">
                You already have items from {shop.name} in your cart. Add this shared list on top, or replace your
                cart with it?
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Button size="full" onClick={() => pendingAction && finish("merge", pendingAction)}>
                  Merge quantities
                </Button>
                <Button size="full" variant="secondary" onClick={() => pendingAction && finish("replace", pendingAction)}>
                  Replace my cart
                </Button>
                <Button size="full" variant="ghost" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-display text-lg font-semibold text-ink">Start a new cart?</h2>
              <p className="mt-3 text-sm text-ink-soft">
                Your cart has items from another shop. Loading this shared cart will clear it and start a cart from{" "}
                <strong>{shop.name}</strong>.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Button size="full" onClick={() => pendingAction && finish("replace", pendingAction)}>
                  Clear and load
                </Button>
                <Button size="full" variant="ghost" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </Sheet>
    </div>
  );
}
