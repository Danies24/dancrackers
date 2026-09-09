"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { computeTotals, isBelowMinimumOrder, shortfallToMinimum, type PricingResult } from "@/lib/pricing";
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
  settings: { discountPercent: number; minOrderValue: number };
  belowMinimum: boolean;
  shortfall: number;
}

/** Shared by /cart and /enquiry — one revalidation call, one totals computation (§15.3). */
export function useValidatedCart(): ValidatedCart {
  const { items } = useCart();
  const [validated, setValidated] = useState<ValidateResultItem[] | null>(null);
  const [settings, setSettings] = useState({ discountPercent: 0, minOrderValue: 0 });
  const [loading, setLoading] = useState(true);

  const idsKey = items.map((i) => i.productId).join(",");

  useEffect(() => {
    if (items.length === 0) {
      setValidated([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/products/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: items.map((i) => i.productId) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setValidated(data.items ?? []);
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {
        if (!cancelled) setValidated([]);
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
    })),
    settings.discountPercent,
  );

  return {
    loading,
    resolved,
    activeLines,
    unavailableLines,
    totals,
    settings,
    belowMinimum: isBelowMinimumOrder(totals.grandTotal, settings.minOrderValue),
    shortfall: shortfallToMinimum(totals.grandTotal, settings.minOrderValue),
  };
}
