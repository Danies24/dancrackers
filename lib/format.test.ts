import { describe, expect, it } from "vitest";
import { formatRupees, formatNumberIndian, hoursSince } from "./format";

describe("formatNumberIndian — Indian grouping at various magnitudes", () => {
  it("formats 4-digit numbers", () => {
    expect(formatNumberIndian(5856)).toBe("5,856");
  });
  it("formats 5-digit numbers with the Indian lakh grouping", () => {
    expect(formatNumberIndian(23000)).toBe("23,000");
  });
  it("formats 6-digit numbers", () => {
    expect(formatNumberIndian(123456)).toBe("1,23,456");
  });
  it("formats 7-digit numbers", () => {
    expect(formatNumberIndian(1234567)).toBe("12,34,567");
  });
});

describe("formatRupees", () => {
  it("prefixes with ₹ and has no trailing decimals", () => {
    expect(formatRupees(144)).toBe("₹144");
    expect(formatRupees(5856.4)).toBe("₹5,856");
  });
});

describe("hoursSince", () => {
  it("computes elapsed hours for the SLA alarm (§19.4)", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(hoursSince(threeHoursAgo)).toBeGreaterThan(2.9);
    expect(hoursSince(threeHoursAgo)).toBeLessThan(3.1);
  });
});
