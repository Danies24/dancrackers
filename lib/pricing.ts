/**
 * The single implementation of the product-pricing and cart/order
 * calculation rules. Imported by the product-pricing trigger's app-level
 * mirror, the cart UI, the enquiry API and the admin display — never
 * reimplemented. Two implementations of a discount rule is two different
 * totals on one order.
 */

import { getMinimumOrderValue } from "@/config/brandConfig";

export interface PricingLine {
  price: number;
  quantity: number;
  isDiscountable: boolean;
  /** MRP for this line — only meaningful when isDiscountable; used for "you save". */
  mrp?: number | null;
}

export interface PricingResult {
  subtotal: number;
  discountableSubtotal: number;
  netRateSubtotal: number;
  /** Sum of mrp × quantity across discountable lines (0 if none carry an mrp). */
  mrpTotal: number;
  /** mrpTotal - discountableSubtotal, floored at 0. */
  youSave: number;
  grandTotal: number;
  totalQuantity: number;
  lines: Array<PricingLine & { lineTotal: number }>;
}

/** Round half-up to 2 decimal places (never banker's rounding). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Round half-up to the nearest whole rupee — matches the Postgres trigger that maintains products.price. */
export function roundRupee(value: number): number {
  return Math.round(value);
}

export function lineTotal(line: PricingLine): number {
  return round2(line.price * line.quantity);
}

/**
 * Per-product pricing (§1 of the SSR pricing model): the customer price and
 * commission from a product's MRP/discount/markup, plus the live global
 * supplier discount. Mirrors the `compute_product_customer_price` DB
 * trigger for the customer-price half — supplier price and commission are
 * never stored, only computed here, at read time.
 */
export interface ProductPricingInput {
  mrp: number | null;
  isDiscountable: boolean;
  discountPercent: number;
  netMarkupPercent: number;
  supplierDiscountPercent: number;
}

export interface ProductPricingResult {
  customerPrice: number | null;
  supplierPrice: number | null;
  commission: number | null;
}

export function computeProductPricing(input: ProductPricingInput): ProductPricingResult {
  const { mrp, isDiscountable, discountPercent, netMarkupPercent, supplierDiscountPercent } = input;

  if (mrp == null) {
    return { customerPrice: null, supplierPrice: null, commission: null };
  }

  const customerPrice = isDiscountable
    ? roundRupee((mrp * (100 - discountPercent)) / 100)
    : roundRupee((mrp * (100 + netMarkupPercent)) / 100);

  const supplierPrice = isDiscountable ? roundRupee((mrp * (100 - supplierDiscountPercent)) / 100) : mrp;

  const commission = customerPrice - supplierPrice;

  return { customerPrice, supplierPrice, commission };
}

/**
 * Computes every cart/order total from a set of already-priced lines. Each
 * line's `price` is the final, already-discounted/marked-up customer price
 * (per-product discount is baked in at the product level — there is no
 * separate global discount step any more). Pure and synchronous — the cart
 * UI calls this on every quantity change with no server round trip.
 */
export function computeTotals(lines: PricingLine[]): PricingResult {
  const linesWithTotals = lines.map((line) => ({
    ...line,
    lineTotal: lineTotal(line),
  }));

  const subtotal = round2(linesWithTotals.reduce((sum, l) => sum + l.lineTotal, 0));
  const discountableSubtotal = round2(
    linesWithTotals.filter((l) => l.isDiscountable).reduce((sum, l) => sum + l.lineTotal, 0),
  );
  const netRateSubtotal = round2(
    linesWithTotals.filter((l) => !l.isDiscountable).reduce((sum, l) => sum + l.lineTotal, 0),
  );
  const mrpTotal = round2(
    linesWithTotals
      .filter((l) => l.isDiscountable && l.mrp != null)
      .reduce((sum, l) => sum + (l.mrp as number) * l.quantity, 0),
  );
  const youSave = Math.max(0, round2(mrpTotal - discountableSubtotal));
  const grandTotal = subtotal;
  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);

  return {
    subtotal,
    discountableSubtotal,
    netRateSubtotal,
    mrpTotal,
    youSave,
    grandTotal,
    totalQuantity,
    lines: linesWithTotals,
  };
}

/** Grand total rounded to a whole rupee for display. */
export function roundToRupee(value: number): number {
  return Math.round(value);
}

export function isBelowMinimumOrder(grandTotal: number, minOrderValue: number): boolean {
  if (minOrderValue <= 0) return false;
  return grandTotal < minOrderValue;
}

export function shortfallToMinimum(grandTotal: number, minOrderValue: number): number {
  return Math.max(0, round2(minOrderValue - grandTotal));
}

/** Convenience: the minimum-order check against the state-based rule (re-exported for call sites that only need pricing.ts). */
export function isBelowMinimumOrderForState(grandTotal: number, state: string | null | undefined): boolean {
  return isBelowMinimumOrder(grandTotal, getMinimumOrderValue(state));
}

export function shortfallToMinimumForState(grandTotal: number, state: string | null | undefined): number {
  return shortfallToMinimum(grandTotal, getMinimumOrderValue(state));
}
