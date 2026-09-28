import { formatRupees } from "@/lib/format";
import { isBelowMinimumOrderValue, shortfallToMinimumValue } from "@/lib/pricing";
import { getShopDeliveryConfig } from "@/config/deliveryConfig";

/**
 * Shown instead of the generic free-delivery progress bar/banner for any
 * Gurusamy Fireworks cart — that shop never offers free delivery, so the
 * "add more to unlock free delivery" nudge would be misleading. Still
 * surfaces the ₹2,999 minimum-order shortfall (that rule is unchanged and
 * shop-agnostic) alongside the wholesale/delivery notice.
 */
export function GurusamyDeliveryNotice({ subtotal, compact = false }: { subtotal: number; compact?: boolean }) {
  const { delivery } = getShopDeliveryConfig("gurusamy-fireworks");
  const belowMinimum = isBelowMinimumOrderValue(subtotal);
  const shortfall = shortfallToMinimumValue(subtotal);

  return (
    <div className={compact ? "flex flex-col gap-0.5" : "rounded-md bg-gold-tint px-3 py-2"}>
      {belowMinimum && (
        <p className={compact ? "text-[11px] font-semibold text-maroon-ink" : "text-xs font-semibold text-maroon-ink"}>
          Add {formatRupees(shortfall)} more to reach the minimum order
        </p>
      )}
      <p lang="ta" className={compact ? "text-[11px] font-semibold text-gold-ink" : "text-xs font-semibold text-gold-ink"}>
        மொத்த விற்பனை நேரடி தொழிற்சாலை விலை – டெலிவரி கட்டணம் பொருந்தும் ({formatRupees(delivery.flatCharge)})
      </p>
      <p className={compact ? "text-[11px] text-ink-soft" : "text-xs text-ink-soft"}>
        Wholesale factory direct sale – delivery charges applicable ({formatRupees(delivery.flatCharge)})
      </p>
    </div>
  );
}
