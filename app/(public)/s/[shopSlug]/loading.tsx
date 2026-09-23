import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors the real shop PLP layout (dark header, tier strip, filter chips,
 * category circles, one section of cards) so nothing jumps when the real
 * content replaces it — same discipline as the category page's loading.tsx.
 */
export default function ShopPageLoading() {
  return (
    <div>
      <div className="rounded-b-[22px] bg-shop-header-bg px-4 pb-4 pt-4">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-5 w-40" />
          </div>
        </div>
        <Skeleton className="mt-3 h-6 w-32 rounded-full" />
      </div>

      <div className="mx-4 mt-3 h-16 rounded-xl">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>

      <div className="mt-3 border-b border-border px-4 py-3">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      </div>

      <div className="flex gap-3.5 px-4 py-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex w-14 shrink-0 flex-col items-center gap-1">
            <Skeleton className="h-[50px] w-[50px] rounded-full" />
            <Skeleton className="h-2 w-10" />
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-[20px] border border-border p-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-1 h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
