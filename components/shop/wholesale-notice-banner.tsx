/**
 * Small badge for Gurusamy Fireworks's shop header and product pages —
 * sets wholesale-price expectations before the customer even opens the
 * cart. Same pattern as ShopNotOrderableBanner. Deliberately says nothing
 * about delivery charges — the site never advertises those.
 */
export function WholesaleNoticeBanner() {
  return (
    <div className="bg-gold-tint px-4 py-2 text-center text-xs font-semibold text-gold-ink">
      Factory direct retail price.
    </div>
  );
}
