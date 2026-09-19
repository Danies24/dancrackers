import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { spaceGrotesk, manrope, notoSansTamil } from "@/lib/fonts";
import { ToastProvider } from "@/components/ui/toast";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { brandConfig, getCanonicalUrl, getSiteUrl } from "@/config/brandConfig";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: brandConfig.seo.defaultTitle,
    template: brandConfig.seo.titleTemplate,
  },
  description: brandConfig.seo.defaultDescription,
  applicationName: brandConfig.brand.name,
  authors: [{ name: brandConfig.brand.name, url: getSiteUrl() }],
  creator: brandConfig.brand.name,
  publisher: brandConfig.brand.name,
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  alternates: {
    canonical: getCanonicalUrl("/"),
  },
  keywords: [...brandConfig.seo.keywords],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: brandConfig.brand.name,
    title: brandConfig.seo.defaultTitle,
    description: brandConfig.seo.defaultDescription,
    url: getCanonicalUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: brandConfig.seo.defaultTitle,
    description: brandConfig.seo.defaultDescription,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${manrope.variable} ${notoSansTamil.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-cream text-ink">
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{const p=new URLSearchParams(window.location.search);if(p.get('theme')==='dark'||localStorage.getItem('theme')==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}`}
        </Script>
        <ToastProvider>{children}</ToastProvider>
        <AnalyticsScripts />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
