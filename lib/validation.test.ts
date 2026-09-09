import { describe, expect, it } from "vitest";
import {
  addressSchema,
  nameSchema,
  normalizePhone,
  phoneSchema,
  pincodeSchema,
} from "./validation";

describe("normalizePhone — every format in PRD §39.1", () => {
  it("accepts a bare 10-digit number", () => {
    expect(normalizePhone("9876543210")).toBe("9876543210");
  });
  it("strips a leading +91", () => {
    expect(normalizePhone("+91 98765 43210")).toBe("9876543210");
  });
  it("strips a leading 91 when 12 digits total", () => {
    expect(normalizePhone("919876543210")).toBe("9876543210");
  });
  it("strips a leading 0", () => {
    expect(normalizePhone("09876543210")).toBe("9876543210");
  });
  it("strips spaces and hyphens", () => {
    expect(normalizePhone("98765-43210")).toBe("9876543210");
    expect(normalizePhone("98 765 43 210")).toBe("9876543210");
  });
});

describe("phoneSchema", () => {
  it("accepts a valid mobile starting 6-9", () => {
    for (const first of ["6", "7", "8", "9"]) {
      expect(phoneSchema.safeParse(`${first}876543210`).success).toBe(true);
    }
  });
  it("rejects a number starting with 5", () => {
    expect(phoneSchema.safeParse("5876543210").success).toBe(false);
  });
  it("rejects 9 digits", () => {
    expect(phoneSchema.safeParse("987654321").success).toBe(false);
  });
  it("rejects 11 digits", () => {
    expect(phoneSchema.safeParse("98765432101").success).toBe(false);
  });
  it("rejects letters", () => {
    expect(phoneSchema.safeParse("98765abcde").success).toBe(false);
  });
  it("accepts +91 with spaces (PRD AC-3.2)", () => {
    const result = phoneSchema.safeParse("+91 98765 43210");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("9876543210");
  });
});

describe("pincodeSchema", () => {
  it("accepts 6 digits", () => {
    expect(pincodeSchema.safeParse("600096").success).toBe(true);
  });
  it("rejects 5 digits", () => {
    expect(pincodeSchema.safeParse("60009").success).toBe(false);
  });
  it("rejects non-numeric", () => {
    expect(pincodeSchema.safeParse("60009A").success).toBe(false);
  });
});

describe("nameSchema bounds", () => {
  it("rejects a single character", () => {
    expect(nameSchema.safeParse("A").success).toBe(false);
  });
  it("accepts 2 characters", () => {
    expect(nameSchema.safeParse("Aa").success).toBe(true);
  });
  it("rejects over 60 characters", () => {
    expect(nameSchema.safeParse("A".repeat(61)).success).toBe(false);
  });
});

describe("addressSchema bounds", () => {
  it("rejects under 10 characters", () => {
    expect(addressSchema.safeParse("short").success).toBe(false);
  });
  it("accepts a normal address", () => {
    expect(
      addressSchema.safeParse("12/4 Sunrise Apartments, Perungudi, Chennai").success,
    ).toBe(true);
  });
  it("rejects over 200 characters", () => {
    expect(addressSchema.safeParse("A".repeat(201)).success).toBe(false);
  });
});
