import { describe, expect, it } from "vitest";
import {
  computeProductPricing,
  computeTotals,
  isBelowMinimumOrder,
  isBelowMinimumOrderForState,
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

describe("computeProductPricing — the SSR pricing model worked examples", () => {
  const supplierDiscountPercent = 90;

  it.each([
    { mrp: 70, discountPercent: 80, customerPrice: 14, supplierPrice: 7, commission: 7 },
    { mrp: 180, discountPercent: 80, customerPrice: 36, supplierPrice: 18, commission: 18 },
    { mrp: 1560, discountPercent: 80, customerPrice: 312, supplierPrice: 156, commission: 156 },
  ])(
    "discountable: mrp %o -> customer $customerPrice, supplier $supplierPrice, commission $commission",
    ({ mrp, discountPercent, customerPrice, supplierPrice, commission }) => {
      const result = computeProductPricing({
        mrp,
        isDiscountable: true,
        discountPercent,
        netMarkupPercent: 10,
        supplierDiscountPercent,
      });
      expect(result.customerPrice).toBe(customerPrice);
      expect(result.supplierPrice).toBe(supplierPrice);
      expect(result.commission).toBe(commission);
    },
  );

  it.each([
    { mrp: 320, netMarkupPercent: 10, customerPrice: 352, supplierPrice: 320, commission: 32 },
    { mrp: 1200, netMarkupPercent: 10, customerPrice: 1320, supplierPrice: 1200, commission: 120 },
  ])(
    "net-rate: mrp %o -> customer $customerPrice, supplier $supplierPrice, commission $commission",
    ({ mrp, netMarkupPercent, customerPrice, supplierPrice, commission }) => {
      const result = computeProductPricing({
        mrp,
        isDiscountable: false,
        discountPercent: 80,
        netMarkupPercent,
        supplierDiscountPercent,
      });
      expect(result.customerPrice).toBe(customerPrice);
      expect(result.supplierPrice).toBe(supplierPrice);
      expect(result.commission).toBe(commission);
    },
  );

  it("returns null customer/supplier price and commission when mrp is null — not orderable", () => {
    const result = computeProductPricing({
      mrp: null,
      isDiscountable: true,
      discountPercent: 80,
      netMarkupPercent: 10,
      supplierDiscountPercent,
    });
    expect(result.customerPrice).toBeNull();
    expect(result.supplierPrice).toBeNull();
    expect(result.commission).toBeNull();
  });

  it("flags a negative commission when the customer discount exceeds the supplier discount", () => {
    const result = computeProductPricing({
      mrp: 1000,
      isDiscountable: true,
      discountPercent: 92,
      netMarkupPercent: 10,
      supplierDiscountPercent: 90,
    });
    // customer price = 1000 * 0.08 = 80, supplier price = 1000 * 0.10 = 100
    expect(result.customerPrice).toBe(80);
    expect(result.supplierPrice).toBe(100);
    expect(result.commission).toBe(-20);
    expect(result.commission!).toBeLessThan(0);
  });
});

describe("computeTotals — per-product prices already carry the discount", () => {
  const lines = [
    { price: 144, quantity: 10, isDiscountable: true, mrp: 720 }, // discountable, MRP 720 each
    { price: 180, quantity: 5, isDiscountable: true, mrp: 900 }, // discountable, MRP 900 each
    { price: 3750, quantity: 1, isDiscountable: false }, // net-rate, no MRP
  ];

  it("sums line totals with no separate global discount step", () => {
    const result = computeTotals(lines);
    expect(result.subtotal).toBe(6090);
    expect(result.discountableSubtotal).toBe(2340);
    expect(result.netRateSubtotal).toBe(3750);
    expect(result.grandTotal).toBe(6090);
    expect(result.totalQuantity).toBe(16);
  });

  it("computes each line total as price × quantity, never as an input", () => {
    const result = computeTotals(lines);
    expect(result.lines[0].lineTotal).toBe(1440);
    expect(result.lines[1].lineTotal).toBe(900);
    expect(result.lines[2].lineTotal).toBe(3750);
  });

  it("computes mrpTotal and youSave from each line's own mrp", () => {
    const result = computeTotals(lines);
    // mrpTotal = 720*10 + 900*5 = 7200 + 4500 = 11700
    expect(result.mrpTotal).toBe(11700);
    // youSave = mrpTotal - discountableSubtotal = 11700 - 2340
    expect(result.youSave).toBe(9360);
  });
});

describe("computeTotals — edge cases", () => {
  it("returns all zeros for an empty cart", () => {
    const result = computeTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.mrpTotal).toBe(0);
    expect(result.youSave).toBe(0);
    expect(result.grandTotal).toBe(0);
    expect(result.totalQuantity).toBe(0);
  });

  it("handles a single item", () => {
    const result = computeTotals([{ price: 99.5, quantity: 3, isDiscountable: true }]);
    expect(result.subtotal).toBe(298.5);
    expect(result.grandTotal).toBe(298.5);
  });

  it("treats a missing mrp as no saving, never a negative youSave", () => {
    const result = computeTotals([{ price: 100, quantity: 1, isDiscountable: true, mrp: undefined }]);
    expect(result.mrpTotal).toBe(0);
    expect(result.youSave).toBe(0);
  });

  it("collapses net-rate subtotal to zero when every item is discountable", () => {
    const result = computeTotals([
      { price: 100, quantity: 1, isDiscountable: true, mrp: 500 },
      { price: 200, quantity: 2, isDiscountable: true, mrp: 1000 },
    ]);
    expect(result.netRateSubtotal).toBe(0);
    expect(result.discountableSubtotal).toBe(result.subtotal);
  });

  it("excludes net-rate items from mrpTotal entirely", () => {
    const result = computeTotals([{ price: 1000, quantity: 1, isDiscountable: false }]);
    expect(result.mrpTotal).toBe(0);
    expect(result.youSave).toBe(0);
    expect(result.grandTotal).toBe(1000);
  });

  it("handles 50 items without drift", () => {
    const lines = Array.from({ length: 50 }, (_, i) => ({
      price: 24 + i,
      quantity: i + 1,
      isDiscountable: i % 2 === 0,
    }));
    const result = computeTotals(lines);
    const expectedSubtotal = round2(lines.reduce((sum, l) => sum + round2(l.price * l.quantity), 0));
    expect(result.subtotal).toBe(expectedSubtotal);
  });
});

describe("roundToRupee", () => {
  it("rounds the display total to a whole rupee", () => {
    expect(roundToRupee(5856.5)).toBe(5857);
    expect(roundToRupee(5856.49)).toBe(5856);
  });
});

describe("minimum order helpers", () => {
  it("is never below minimum when min_order_value is 0", () => {
    expect(isBelowMinimumOrder(10, 0)).toBe(false);
  });

  it("flags a cart below the configured minimum", () => {
    expect(isBelowMinimumOrder(2150, 3000)).toBe(true);
    expect(isBelowMinimumOrder(3000, 3000)).toBe(false);
  });

  it("computes the exact shortfall from a worked example", () => {
    expect(shortfallToMinimum(2150, 3000)).toBe(850);
  });

  it("applies the Tamil Nadu minimum (₹3,000) for a Tamil Nadu delivery state", () => {
    expect(isBelowMinimumOrderForState(2999, "Tamil Nadu")).toBe(true);
    expect(isBelowMinimumOrderForState(3000, "Tamil Nadu")).toBe(false);
    expect(isBelowMinimumOrderForState(3000, "tamil nadu")).toBe(false);
  });

  it("applies the other-states minimum (₹5,000) for any non-Tamil-Nadu state", () => {
    expect(isBelowMinimumOrderForState(4999, "Kerala")).toBe(true);
    expect(isBelowMinimumOrderForState(5000, "Kerala")).toBe(false);
    expect(isBelowMinimumOrderForState(5000, null)).toBe(false);
    expect(isBelowMinimumOrderForState(4999, undefined)).toBe(true);
  });
});
