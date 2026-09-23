import { CrossShopCatalogueLoadingSkeleton } from "@/components/product/cross-shop-catalogue-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsPageLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Skeleton className="h-8 w-48" />
      <CrossShopCatalogueLoadingSkeleton />
    </div>
  );
}
