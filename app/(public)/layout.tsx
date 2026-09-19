import { CartProvider } from "@/components/cart/cart-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StickyCartBar } from "@/components/cart/sticky-cart-bar";
import { OrderCountdownBanner } from "@/components/marketing/order-countdown-banner";
import { getCategoryWithCounts } from "@/lib/data";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Every active category with at least one product — never a hardcoded
  // subset, and never a dead-end link to an empty category.
  const categoriesWithCounts = await getCategoryWithCounts().catch(() => []);
  const categories = categoriesWithCounts.filter((c) => c.productCount > 0);

  return (
    <CartProvider>
      <OrderCountdownBanner />
      <Header categories={categories} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer topCategories={categories} />
      <StickyCartBar />
    </CartProvider>
  );
}
