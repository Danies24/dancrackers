/**
 * Aggregates captain-attributed orders into per-captain performance numbers.
 * Shared by the captains list page and a single captain's detail page so
 * both compute "orders / delivered / revenue / commission" the same way.
 */

export interface CaptainStats {
  totalOrders: number;
  deliveredOrders: number;
  distinctCustomers: number;
  revenue: number;
  commissionEarned: number;
  commissionPayable: number;
}

export interface CaptainOrderRow {
  captain_id: string | null;
  customer_id: string;
  status: string;
  grand_total: number | string;
  commission_amount: number | string | null;
  commission_paid_at: string | null;
}

function emptyStats(): CaptainStats {
  return { totalOrders: 0, deliveredOrders: 0, distinctCustomers: 0, revenue: 0, commissionEarned: 0, commissionPayable: 0 };
}

export function computeCaptainStats(orders: CaptainOrderRow[]): Map<string, CaptainStats> {
  const byCaptain = new Map<string, CaptainStats>();
  const customersByCaptain = new Map<string, Set<string>>();

  for (const order of orders) {
    if (!order.captain_id) continue;
    const stats = byCaptain.get(order.captain_id) ?? emptyStats();
    const customers = customersByCaptain.get(order.captain_id) ?? new Set<string>();

    stats.totalOrders += 1;
    customers.add(order.customer_id);

    if (order.status === "DELIVERED") {
      stats.deliveredOrders += 1;
      stats.revenue += Number(order.grand_total);
    }
    if (order.commission_amount != null) {
      stats.commissionEarned += Number(order.commission_amount);
      if (!order.commission_paid_at) stats.commissionPayable += Number(order.commission_amount);
    }

    stats.distinctCustomers = customers.size;
    byCaptain.set(order.captain_id, stats);
    customersByCaptain.set(order.captain_id, customers);
  }

  return byCaptain;
}
