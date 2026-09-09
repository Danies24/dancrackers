import type { Metadata } from "next";
import { fraunces, inter, notoSansTamil } from "@/lib/fonts";
import { CartProvider } from "@/components/cart/cart-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StickyCartBar } from "@/components/cart/sticky-cart-bar";
import { getActiveCategories } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${siteConfig.name} — Sivakasi Crackers for Chennai | Order Online`,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Browse the full Sivakasi crackers price list with photos. Build your order, we call you to confirm. Supplied by licensed Sivakasi manufacturers.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getActiveCategories().catch(() => []);

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${notoSansTamil.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-cream text-ink">
        <CartProvider>
          <ToastProvider>
            <Header categories={categories} />
            <main id="main-content" className="flex-1 pb-16 md:pb-0">
              {children}
            </main>
            <Footer topCategories={categories} />
            <StickyCartBar />
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
