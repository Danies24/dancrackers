export function TrustBar() {
  return (
    <div className="overflow-hidden bg-gradient-to-r from-maroon to-maroon-ink py-2 text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center sm:justify-center px-4">
        <div className="animate-marquee-mobile flex w-full items-center gap-6 text-[11px] font-bold tracking-wide sm:w-auto sm:justify-center sm:text-xs md:text-sm">
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-lg leading-none">🔒</span>
            <span>100% Genuine Sivakasi Brands</span>
          </div>
          <div className="hidden h-3 w-px shrink-0 bg-white/20 sm:block" />
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-lg leading-none">💰</span>
            <span>Lowest Wholesale Prices</span>
          </div>
          <div className="hidden h-3 w-px shrink-0 bg-white/20 md:block" />
          <div className="flex shrink-0 items-center gap-1.5 md:flex">
            <span className="text-lg leading-none">🚚</span>
            <span>Fast & Safe Delivery</span>
          </div>
        </div>
      </div>
    </div>
  );
}
