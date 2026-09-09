import { beforeEach, describe, expect, it } from "vitest";
import { captureReferral, clearReferral, getReferral, normalizeCode } from "./referral";

describe("normalizeCode", () => {
  it("accepts and uppercases a valid code", () => {
    expect(normalizeCode("raj12")).toBe("RAJ12");
  });
  it("rejects a malformed code", () => {
    expect(normalizeCode("RAJ1")).toBeNull();
    expect(normalizeCode("RAJ123")).toBeNull();
    expect(normalizeCode("1AJ12")).toBeNull();
  });
});

describe("captureReferral / getReferral", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a captured code", () => {
    captureReferral("raj12");
    expect(getReferral()).toBe("RAJ12");
  });

  it("last click wins (§20.4)", () => {
    captureReferral("RAJ12");
    captureReferral("PRI07");
    expect(getReferral()).toBe("PRI07");
  });

  it("expires after the 30-day window (§20.4, AC-4.3)", () => {
    const stale = { code: "RAJ12", at: Date.now() - 31 * 86_400_000 };
    localStorage.setItem("dc_ref", JSON.stringify(stale));
    expect(getReferral()).toBeNull();
  });

  it("is still valid at exactly 3 days (well within window)", () => {
    const recent = { code: "RAJ12", at: Date.now() - 3 * 86_400_000 };
    localStorage.setItem("dc_ref", JSON.stringify(recent));
    expect(getReferral()).toBe("RAJ12");
  });

  it("returns null for malformed storage instead of throwing", () => {
    localStorage.setItem("dc_ref", "{not json");
    expect(getReferral()).toBeNull();
  });

  it("returns null when nothing was ever captured", () => {
    expect(getReferral()).toBeNull();
  });

  it("clearReferral removes the stored code", () => {
    captureReferral("RAJ12");
    clearReferral();
    expect(getReferral()).toBeNull();
  });
});
