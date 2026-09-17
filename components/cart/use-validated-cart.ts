"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import {
  computeTotals,
  isBelowMinimumOrderForState,
  shortfallToMinimumForState,
  type PricingResult,
} from "@/lib/pricing";
import type { ValidateResultItem } from "@/app/api/products/validate/route";

export interface ResolvedCartLine {
  productId: string;
  qty: number;
  priceAtAdd: number;
  validated: ValidateResultItem | undefined;
}

export interface ValidatedCart {
  loading: boolean;
  resolved: ResolvedCartLine[];
  activeLines: ResolvedCartLine[];
  unavailableLines: ResolvedCartLine[];
  totals: PricingResult;
  /** Only meaningful once a delivery state is known — false/0 until then. */
  belowMinimum: boolean;
  shortfall: number;
}

/**
 * Shared by /cart and /enquiry — one revalidation call, one totals
 * computation. Each product's discount is already baked into its `price`
 * by the DB, so this hook no longer needs a global discount setting.
 *
 * `state` is the customer's delivery state, only known once they reach the
 * enquiry form — pass it there to get a real minimum-order check; omit it
 * (as the cart page does) to skip that check entirely rather than show a
 * wrong number.
 */
export function useValidatedCart(state?: string | null): ValidatedCart {
  const { items } = useCart();
  const [validated, setValidated] = useState<ValidateResultItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  const idsKey = items.map((i) => i.productId).join(",");

  useEffect(() => {
    if (items.length === 0) {
      setValidated([]);
      setLoading(false);
      return;
    }

    // Only ever fetch validation for product IDs we don't already have —
    // removing/reordering/changing qty on items already in the cart never
    // needs a network round trip, so it never needs to show loading again.
    const knownIds = new Set((validated ?? []).map((v) => v.productId));
    const missingIds = items.map((i) => i.productId).filter((id) => !knownIds.has(id));

    if (missingIds.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch("/api/products/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: missingIds }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setValidated((prev) => [...(prev ?? []), ...(data.items ?? [])]);
      })
      .catch(() => {
        if (!cancelled) setValidated((prev) => prev ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const resolved: ResolvedCartLine[] = items.map((i) => ({
    productId: i.productId,
    qty: i.qty,
    priceAtAdd: i.priceAtAdd,
    validated: validated?.find((v) => v.productId === i.productId),
  }));

  const activeLines = resolved.filter(
    (l) => l.validated?.exists && l.validated.status === "active" && l.validated.price != null,
  );
  const unavailableLines = resolved.filter(
    (l) => !l.validated || !l.validated.exists || l.validated.status !== "active" || l.validated.price == null,
  );

  const totals = computeTotals(
    activeLines.map((l) => ({
      price: l.validated!.price!,
      quantity: l.qty,
      isDiscountable: l.validated!.isDiscountable ?? true,
      mrp: l.validated!.mrp,
    })),
  );

  return {
    loading,
    resolved,
    activeLines,
    unavailableLines,
    totals,
    belowMinimum: state ? isBelowMinimumOrderForState(totals.grandTotal, state) : false,
    shortfall: state ? shortfallToMinimumForState(totals.grandTotal, state) : 0,
  };
}
