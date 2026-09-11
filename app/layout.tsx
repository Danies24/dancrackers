import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { spaceGrotesk, manrope, notoSansTamil } from "@/lib/fonts";
import { ToastProvider } from "@/components/ui/toast";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { brandConfig, getSiteUrl } from "@/config/brandConfig";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: brandConfig.seo.defaultTitle,
    template: brandConfig.seo.titleTemplate,
  },
  description: brandConfig.seo.defaultDescription,
  keywords: [...brandConfig.seo.keywords],
  openGraph: {
    type: "website",
    siteName: brandConfig.brand.name,
    title: brandConfig.seo.defaultTitle,
    description: brandConfig.seo.defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: brandConfig.seo.defaultTitle,
    description: brandConfig.seo.defaultDescription,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${manrope.variable} ${notoSansTamil.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-cream text-ink">
        <ToastProvider>{children}</ToastProvider>
        <AnalyticsScripts />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
