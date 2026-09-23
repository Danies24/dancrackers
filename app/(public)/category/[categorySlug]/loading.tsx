import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors CategoryPageClient's real layout (top bar, search+NO-SOUND row,
 * tabs, chip row, 2 group blocks with a few card skeletons each) so nothing
 * jumps when the real content replaces it.
 */
export default function CategoryPageLoading() {
  return (
    <div>
      <div className="border-b border-border bg-surface px-4 py-3.5">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <div className="border-b border-border px-4 py-3">
        <div className="mx-auto max-w-6xl">
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
          <div className="mt-3 flex gap-5">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 shrink-0 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-4">
        {Array.from({ length: 2 }).map((_, groupIdx) => (
          <div key={groupIdx} className="mb-6 rounded-[28px] bg-surface py-5 pl-5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-2 h-3 w-28" />
            <div className="mt-4 flex gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-44 shrink-0">
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <Skeleton className="mt-2 h-4 w-3/4" />
                  <Skeleton className="mt-1 h-4 w-1/3" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
