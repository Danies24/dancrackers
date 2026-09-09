import { CartProvider } from "@/components/cart/cart-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StickyCartBar } from "@/components/cart/sticky-cart-bar";
import { getActiveCategories } from "@/lib/data";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const categories = await getActiveCategories().catch(() => []);

  return (
    <CartProvider>
      <Header categories={categories} />
      <main id="main-content" className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <Footer topCategories={categories} />
      <StickyCartBar />
    </CartProvider>
  );
}
