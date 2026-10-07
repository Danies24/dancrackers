import { describe, expect, it } from "vitest";
import { computeCaptainStats } from "./captain-stats";

const base = { captain_id: "c1", customer_id: "u1", commission_paid_at: null };

describe("computeCaptainStats", () => {
  it("ignores SPAM (test) orders entirely", () => {
    const stats = computeCaptainStats([
      { ...base, status: "DELIVERED", grand_total: 1000, commission_amount: 100 },
      { ...base, customer_id: "u2", status: "SPAM", grand_total: 20900, commission_amount: 2090 },
    ]);
    expect(stats.get("c1")).toEqual({
      totalOrders: 1,
      deliveredOrders: 1,
      distinctCustomers: 1,
      revenue: 1000,
      commissionEarned: 100,
      commissionPayable: 100,
    });
  });

  it("gives a captain with only SPAM orders no stats row", () => {
    const stats = computeCaptainStats([{ ...base, status: "SPAM", grand_total: 500, commission_amount: 50 }]);
    expect(stats.has("c1")).toBe(false);
  });
});
