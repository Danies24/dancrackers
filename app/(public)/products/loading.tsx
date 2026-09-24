import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the new shop-switcher + shop-PLP-sections layout (app/(public)/products/page.tsx). */
export default function ProductsPageLoading() {
  return (
    <div>
      <div className="flex gap-2 border-b border-border px-4 py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="px-4 pt-4">
        <Skeleton className="h-6 w-40" />
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
