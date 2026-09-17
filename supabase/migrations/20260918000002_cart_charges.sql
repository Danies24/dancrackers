-- Cart-level packaging + delivery charges (§ cartCharges).
--
-- Minimum order value moved from a state-based rule (₹3,000 Tamil Nadu /
-- ₹5,000 other states) to a flat ₹2,999 floor, and two new order-level
-- charges were introduced: a 3% packaging charge (waived at/above ₹3,499
-- item subtotal) and a flat ₹400 delivery charge (waived at/above ₹3,999
-- item subtotal). Both are computed by computeTotals() in lib/pricing.ts
-- and stored here purely as a record of what was actually charged —
-- orders.grand_total already includes them (subtotal + packaging_charge +
-- delivery_charge).

alter table orders
  add column if not exists packaging_charge numeric(12, 2) not null default 0,
  add column if not exists delivery_charge numeric(12, 2) not null default 0;
