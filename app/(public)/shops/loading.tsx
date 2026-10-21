import { Skeleton } from "@/components/ui/skeleton";

export default function ShopsLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-shop-header-bg px-4 pt-8">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mb-8 mt-3 h-4 w-32" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-[132px] w-[132px] rounded-[28px]" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
