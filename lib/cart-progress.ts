/**
 * The single "what's the next cart milestone" computation (§ cartCharges) —
 * shared by the thin progress bar on /cart and the animated hero banner
 * above the site-wide sticky cart bar, so the two never show different
 * numbers. Always resolves against the item subtotal (before packaging/
 * delivery are added), same basis computeTotals() uses for the charges
 * themselves.
 */
import { brandConfig } from "@/config/brandConfig";
import { formatRupees } from "@/lib/format";
import { round2 } from "@/lib/pricing";

export interface CartProgressMilestone {
  done: false;
  threshold: number;
  remaining: number;
  /** 0-100, subtotal's progress toward `threshold`. */
  progressPercent: number;
  /** e.g. "Add ₹99 more for FREE delivery" */
  message: string;
  /** Short badge label, e.g. "FREE DELIVERY" */
  tag: string;
}

export interface CartProgressDone {
  done: true;
}

export type CartProgressState = CartProgressMilestone | CartProgressDone;

interface MilestoneDef {
  threshold: number;
  tag: string;
  message: (remaining: string) => string;
}

export function getCartProgress(subtotal: number): CartProgressState {
  const { minimumOrderValue, packagingChargeWaiverThreshold, deliveryChargeWaiverThreshold } =
    brandConfig.cartCharges;

  const milestones: MilestoneDef[] = [
    {
      threshold: minimumOrderValue,
      tag: "MINIMUM ORDER",
      message: (remaining) => `Add ${remaining} more to reach the ${formatRupees(minimumOrderValue)} minimum order`,
    },
    {
      threshold: packagingChargeWaiverThreshold,
      tag: "FREE PACKAGING",
      message: (remaining) => `Add ${remaining} more to avail zero packaging charges`,
    },
    {
      threshold: deliveryChargeWaiverThreshold,
      tag: "FREE DELIVERY",
      message: (remaining) => `Add ${remaining} more to avail zero delivery charges`,
    },
  ];

  const next = milestones.find((m) => subtotal < m.threshold);
  if (!next) return { done: true };

  const remaining = round2(next.threshold - subtotal);
  const progressPercent = Math.min(100, Math.max(0, (subtotal / next.threshold) * 100));

  return {
    done: false,
    threshold: next.threshold,
    remaining,
    progressPercent,
    message: next.message(formatRupees(remaining)),
    tag: next.tag,
  };
}

/**
 * Which of the three milestones the subtotal currently clears: 0 (none),
 * 1 (minimum order), 2 (+ zero packaging), 3 (+ free delivery — fully done).
 * A rising tier is exactly the moment to fire the crossing celebration —
 * see components/cart/use-cart-milestone-celebration.ts.
 */
export function getCartTier(subtotal: number): 0 | 1 | 2 | 3 {
  const { minimumOrderValue, packagingChargeWaiverThreshold, deliveryChargeWaiverThreshold } =
    brandConfig.cartCharges;
  if (subtotal >= deliveryChargeWaiverThreshold) return 3;
  if (subtotal >= packagingChargeWaiverThreshold) return 2;
  if (subtotal >= minimumOrderValue) return 1;
  return 0;
}

/** One-line celebratory copy shown briefly when a tier is first reached. */
export const CART_TIER_CELEBRATION: Record<1 | 2 | 3, string> = {
  1: "Minimum order reached!",
  2: "Zero packaging charges unlocked!",
  3: "Free delivery unlocked!",
};
