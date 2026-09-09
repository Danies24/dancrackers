import { describe, expect, it } from "vitest";
import {
  computeTotals,
  isBelowMinimumOrder,
  round2,
  roundToRupee,
  shortfallToMinimum,
} from "./pricing";

describe("round2", () => {
  it("rounds half-up at the .005 boundary", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(1.004)).toBe(1);
    expect(round2(2.675)).toBe(2.68);
  });
});

describe("computeTotals — PRD §15.4 worked example", () => {
  const lines = [
    { price: 144, quantity: 10, isDiscountable: true }, // Seven Shot — ₹1,440
    { price: 180, quantity: 5, isDiscountable: true }, // Flower Pot Big — ₹900
    { price: 3750, quantity: 1, isDiscountable: false }, // Premium Gift Box — ₹3,750
  ];

  it("produces the exact figures from the PRD example at 10% discount", () => {
    const result = computeTotals(lines, 10);
    expect(result.subtotal).toBe(6090);
    expect(result.discountableSubtotal).toBe(2340);
    expect(result.netRateSubtotal).toBe(3750);
    expect(result.discountRate).toBe(0.1);
    expect(result.discountAmount).toBe(234);
    expect(result.grandTotal).toBe(5856);
    expect(result.totalQuantity).toBe(16);
  });

  it("computes each line total as price × quantity, never as an input", () => {
    const result = computeTotals(lines, 10);
    expect(result.lines[0].lineTotal).toBe(1440);
    expect(result.lines[1].lineTotal).toBe(900);
    expect(result.lines[2].lineTotal).toBe(3750);
  });
});

describe("computeTotals — edge cases", () => {
  it("returns all zeros for an empty cart", () => {
    const result = computeTotals([], 10);
    expect(result.subtotal).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.grandTotal).toBe(0);
    expect(result.totalQuantity).toBe(0);
  });

  it("handles a single item", () => {
    const result = computeTotals([{ price: 99.5, quantity: 3, isDiscountable: true }], 0);
    expect(result.subtotal).toBe(298.5);
    expect(result.grandTotal).toBe(298.5);
  });

  it("hides discount entirely when discount_percent is 0 (PRD §15.4 BLOCKED default)", () => {
    const result = computeTotals(lines_for_zero_discount(), 0);
    expect(result.discountRate).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.grandTotal).toBe(result.subtotal);
  });

  it("collapses net-rate subtotal to zero when every item is discountable", () => {
    const result = computeTotals(
      [
        { price: 100, quantity: 1, isDiscountable: true },
        { price: 200, quantity: 2, isDiscountable: true },
      ],
      10,
    );
    expect(result.netRateSubtotal).toBe(0);
    expect(result.discountableSubtotal).toBe(result.subtotal);
  });

  it("excludes net-rate items from the discount base entirely", () => {
    const result = computeTotals(
      [{ price: 1000, quantity: 1, isDiscountable: false }],
      50,
    );
    expect(result.discountAmount).toBe(0);
    expect(result.grandTotal).toBe(1000);
  });

  it("handles 50 items without drift", () => {
    const lines = Array.from({ length: 50 }, (_, i) => ({
      price: 24 + i,
      quantity: i + 1,
      isDiscountable: i % 2 === 0,
    }));
    const result = computeTotals(lines, 7);
    const expectedSubtotal = round2(
      lines.reduce((sum, l) => sum + round2(l.price * l.quantity), 0),
    );
    expect(result.subtotal).toBe(expectedSubtotal);
  });

  function lines_for_zero_discount() {
    return [{ price: 500, quantity: 2, isDiscountable: true }];
  }
});

describe("roundToRupee", () => {
  it("rounds the display total to a whole rupee", () => {
    expect(roundToRupee(5856.5)).toBe(5857);
    expect(roundToRupee(5856.49)).toBe(5856);
  });
});

describe("minimum order helpers", () => {
  it("is never below minimum when min_order_value is 0 (mechanism hidden — §15.5)", () => {
    expect(isBelowMinimumOrder(10, 0)).toBe(false);
  });

  it("flags a cart below the configured minimum", () => {
    expect(isBelowMinimumOrder(2150, 3000)).toBe(true);
    expect(isBelowMinimumOrder(3000, 3000)).toBe(false);
  });

  it("computes the exact shortfall from the PRD example", () => {
    expect(shortfallToMinimum(2150, 3000)).toBe(850);
  });
});
