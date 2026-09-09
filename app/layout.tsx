import type { Metadata } from "next";
import { fraunces, inter, notoSansTamil } from "@/lib/fonts";
import { ToastProvider } from "@/components/ui/toast";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const description =
  "Browse the full Sivakasi crackers price list with photos. Build your order, we call you to confirm. Supplied by licensed Sivakasi manufacturers.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${siteConfig.name} — Sivakasi Crackers for Chennai | Order Online`,
    template: `%s | ${siteConfig.name}`,
  },
  description,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Sivakasi Crackers for Chennai`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Sivakasi Crackers for Chennai`,
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${notoSansTamil.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-cream text-ink">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
