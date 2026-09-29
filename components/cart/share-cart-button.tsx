"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { buildShareUrl, buildShortShareUrl, exceedsShareUrlLimit, type ShareCartItem } from "@/lib/cart-share";
import { getWhatsAppLink } from "@/config/brandConfig";

/** The minimal shape ShareCartButton needs per line — shape-agnostic so both /cart (via useValidatedCart) and /cart/shared (its own local edit state) can pass it the same way. */
export interface ShareableLine {
  slug: string;
  qty: number;
  name_en: string;
  name_ta?: string | null;
}

/**
 * "Share cart" — builds the compact ?s=&i= link (lib/cart-share.ts) for a
 * normal-sized cart, or falls back to POSTing /api/cart/share for a short
 * ?id= link once the compact form would exceed SHARE_URL_LENGTH_LIMIT
 * (60+ items). Never puts prices in the link — /cart/shared recomputes
 * those from the live catalogue.
 */
export function ShareCartButton({ shopSlug, lines }: { shopSlug: string; lines: ShareableLine[] }) {
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [building, setBuilding] = useState(false);

  const items: ShareCartItem[] = lines.map((l) => ({ slug: l.slug, qty: l.qty }));

  async function resolveShareUrl(): Promise<string | null> {
    const origin = window.location.origin;
    const compactUrl = buildShareUrl(origin, shopSlug, items);
    if (!exceedsShareUrlLimit(compactUrl)) return compactUrl;

    setBuilding(true);
    try {
      const res = await fetch("/api/cart/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopSlug, items }),
      });
      if (!res.ok) {
        show("This cart is too large to share as a link. Try \"Copy as text\" instead.");
        return null;
      }
      const data = await res.json();
      return buildShortShareUrl(origin, data.id);
    } catch {
      show("Couldn't create a share link. Please try again.");
      return null;
    } finally {
      setBuilding(false);
    }
  }

  async function handleShare() {
    const url = await resolveShareUrl();
    if (!url) return;
    const shareText = `Kolagalam cart – ${items.length} item${items.length === 1 ? "" : "s"}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareText, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    await copyToClipboard(url);
    show("Link copied!");
  }

  async function handleCopyLink() {
    const url = await resolveShareUrl();
    if (!url) return;
    await copyToClipboard(url);
    show("Link copied!");
    setOpen(false);
  }

  async function handleWhatsApp() {
    const url = await resolveShareUrl();
    if (!url) return;
    window.open(getWhatsAppLink(`Here's my Kolagalam cart: ${url}`), "_blank", "noopener");
    setOpen(false);
  }

  async function handleCopyAsText() {
    const textLines = lines.map((l) => {
      const nameTa = l.name_ta ? ` (${l.name_ta})` : "";
      return `${l.name_en}${nameTa} — ${l.qty}`;
    });
    const text = ["My Kolagalam cart:", "", ...textLines].join("\n");
    await copyToClipboard(text);
    show("Cart copied as text!");
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-sm font-semibold text-maroon-ink hover:underline"
      >
        Share cart
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} ariaLabel="Share cart">
        <div className="p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Share cart</h2>
          <p className="mt-1 text-sm text-ink-soft">Share your cart with someone else</p>
          <div className="mt-5 flex flex-col gap-2">
            <Button size="full" onClick={handleShare} disabled={building}>
              Share…
            </Button>
            <Button size="full" variant="secondary" onClick={handleCopyLink} disabled={building}>
              Copy link
            </Button>
            <Button size="full" variant="whatsapp" onClick={handleWhatsApp} disabled={building}>
              Share on WhatsApp
            </Button>
            <Button size="full" variant="ghost" onClick={handleCopyAsText}>
              Copy cart as text
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // clipboard API unavailable — nothing more we can do here.
  }
}
