/**
 * The single implementation of the cart/order calculation rules (PRD §15.4).
 * Imported by the cart UI, the enquiry API and the admin display — never
 * reimplemented. Three implementations of a discount rule is three
 * different totals on one order.
 */

export interface PricingLine {
  price: number;
  quantity: number;
  isDiscountable: boolean;
}

export interface PricingResult {
  subtotal: number;
  discountableSubtotal: number;
  netRateSubtotal: number;
  discountRate: number;
  discountAmount: number;
  grandTotal: number;
  totalQuantity: number;
  lines: Array<PricingLine & { lineTotal: number }>;
}

/** Round half-up to 2 decimal places (never banker's rounding — §15.4). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineTotal(line: PricingLine): number {
  return round2(line.price * line.quantity);
}

/**
 * Computes every total in §15.4 from a set of lines and the current
 * discount_percent setting. Pure and synchronous — the cart UI calls this
 * on every quantity change with no server round trip (§15.6).
 */
export function computeTotals(
  lines: PricingLine[],
  discountPercent: number,
): PricingResult {
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

  const discountRate = discountPercent / 100;
  const discountAmount = round2(discountableSubtotal * discountRate);
  const grandTotal = round2(subtotal - discountAmount);
  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);

  return {
    subtotal,
    discountableSubtotal,
    netRateSubtotal,
    discountRate,
    discountAmount,
    grandTotal,
    totalQuantity,
    lines: linesWithTotals,
  };
}

/** Grand total rounded to a whole rupee for display (§15.4: "displayed as a whole rupee"). */
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
