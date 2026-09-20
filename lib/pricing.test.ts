import { describe, expect, it } from "vitest";
import {
  computeDeliveryCharge,
  computePackagingCharge,
  computeProductPricing,
  computeTotals,
  getDisplayMrp,
  isBelowMinimumOrder,
  isBelowMinimumOrderValue,
  MRP_MULTIPLIER,
  DISPLAY_DISCOUNT_PERCENT,
  round2,
  roundToRupee,
  shortfallToMinimum,
} from "./pricing";

describe("getDisplayMrp — 95% OFF display formula (§4)", () => {
  it("computes mrp = price × 20 with 95% off", () => {
    expect(MRP_MULTIPLIER).toBe(20);
    expect(DISPLAY_DISCOUNT_PERCENT).toBe(95);
    // Worked examples from prompt
    expect(getDisplayMrp(20)).toBe(400);
    expect(getDisplayMrp(3028)).toBe(60560);
  });

  it("rounds to the nearest whole rupee", () => {
    expect(getDisplayMrp(15.4)).toBe(308);
  });
});

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

  it("sums line totals with no separate global discount step, above both charge waiver thresholds", () => {
    const result = computeTotals(lines);
    expect(result.subtotal).toBe(6090);
    expect(result.discountableSubtotal).toBe(2340);
    expect(result.netRateSubtotal).toBe(3750);
    expect(result.packagingCharge).toBe(0);
    expect(result.deliveryCharge).toBe(0);
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

  it("handles a single item, with packaging + delivery charges below both waiver thresholds", () => {
    const result = computeTotals([{ price: 99.5, quantity: 3, isDiscountable: true }]);
    expect(result.subtotal).toBe(298.5);
    expect(result.packagingCharge).toBe(8.96); // 3% of 298.5
    expect(result.deliveryCharge).toBe(400);
    expect(result.grandTotal).toBe(707.46);
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
    expect(result.grandTotal).toBe(1430); // 1000 + 3% packaging (30) + 400 delivery
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

describe("computePackagingCharge / computeDeliveryCharge — § cartCharges (2999 / 3499 / 3999)", () => {
  it("charges 3% packaging and a flat ₹400 delivery below both waiver thresholds", () => {
    expect(computePackagingCharge(3000)).toBe(90);
    expect(computeDeliveryCharge(3000)).toBe(400);
  });

  it("waives packaging at/above ₹3,499 but still charges delivery below ₹3,999", () => {
    expect(computePackagingCharge(3499)).toBe(0);
    expect(computeDeliveryCharge(3499)).toBe(400);
  });

  it("waives delivery at/above ₹3,999", () => {
    expect(computeDeliveryCharge(3999)).toBe(0);
    expect(computePackagingCharge(3999)).toBe(0);
  });

  it("charges nothing for an empty or negative subtotal", () => {
    expect(computePackagingCharge(0)).toBe(0);
    expect(computeDeliveryCharge(0)).toBe(0);
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

  it("applies the flat ₹2,999 minimum from brandConfig, regardless of state", () => {
    expect(isBelowMinimumOrderValue(2998)).toBe(true);
    expect(isBelowMinimumOrderValue(2999)).toBe(false);
    expect(isBelowMinimumOrderValue(5000)).toBe(false);
  });
});
