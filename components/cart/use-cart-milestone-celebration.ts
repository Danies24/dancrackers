"use client";

import { useEffect, useRef, useState } from "react";
import { CART_TIER_CELEBRATION, getCartTier } from "@/lib/cart-progress";
import { playVisilSound } from "@/lib/cracker-sound";

export interface MilestoneCelebration {
  /** Unique per crossing — remount the burst particles on this key so the animation replays. */
  key: number;
  label: string;
}

// Matches how long the burst + ring visuals take to fully fade (both defined
// as 700-750ms one-shot CSS animations in globals.css) plus a hair of slack
// — so the celebration message vanishes right as the blast finishes, and the
// bar's normal "add more to..." copy for the next milestone steps in
// immediately after, instead of sitting on the celebration line.
const CELEBRATION_MS = 800;

/**
 * Fires once per render tree, exactly when `subtotal` newly crosses a cart
 * milestone (minimum order → zero packaging → free delivery) — never on
 * mount with an already-qualifying cart, and never while merely sitting
 * above a threshold. Plays the synthesized visil (whistle) sound and
 * returns the celebration to render (burst particles + a one-line message)
 * for `CELEBRATION_MS`, then clears itself so the next sentence can show.
 */
export function useCartMilestoneCelebration(subtotal: number): MilestoneCelebration | null {
  const previousTierRef = useRef<number | null>(null);
  const keyRef = useRef(0);
  const [celebration, setCelebration] = useState<MilestoneCelebration | null>(null);

  useEffect(() => {
    const tier = getCartTier(subtotal);
    const previousTier = previousTierRef.current;
    previousTierRef.current = tier;

    if (previousTier === null || tier <= previousTier) return;

    keyRef.current += 1;
    setCelebration({ key: keyRef.current, label: CART_TIER_CELEBRATION[tier as 1 | 2 | 3] });
    playVisilSound();

    const timeout = setTimeout(() => setCelebration(null), CELEBRATION_MS);
    return () => clearTimeout(timeout);
  }, [subtotal]);

  return celebration;
}
