import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-black/[0.06]", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col justify-between gap-2 rounded-[18px] border border-border bg-surface p-2.5 sm:p-3">
      <Skeleton className="aspect-[16/10] w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <div className="mt-1 flex items-end justify-between pt-1">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-7 w-12 rounded-lg sm:h-8 sm:w-14" />
      </div>
    </div>
  );
}
