/**
 * Small badge for Gurusamy Fireworks's shop header and product pages —
 * sets wholesale-price/delivery-charge expectations before the customer
 * even opens the cart. Same pattern as ShopNotOrderableBanner.
 */
export function WholesaleNoticeBanner() {
  return (
    <div className="bg-gold-tint px-4 py-2 text-center text-xs font-semibold text-gold-ink">
      Factory direct wholesale price. Delivery charges apply.
    </div>
  );
}
