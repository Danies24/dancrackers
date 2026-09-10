/**
 * Captain commission math. The rate itself is admin-set per captain
 * (captains.commission_rate, editable anytime) — this just turns a rate and
 * an order total into a rupee amount, frozen onto the order at DELIVERED.
 */
import { round2 } from "./pricing";

export function computeCommissionAmount(grandTotal: number, ratePercent: number): number {
  return round2(grandTotal * (ratePercent / 100));
}
