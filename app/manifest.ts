import type { MetadataRoute } from "next";
import { brandConfig } from "@/config/brandConfig";

// Mirrors --shop-header-bg (app/globals.css) — a manifest can't read CSS variables.
const SHOP_HEADER_BG = "#171b2e";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brandConfig.brand.name} — Sivakasi Crackers`,
    short_name: brandConfig.brand.name,
    description: brandConfig.seo.defaultDescription,
    start_url: "/shops?src=pwa",
    display: "standalone",
    background_color: SHOP_HEADER_BG,
    theme_color: SHOP_HEADER_BG,
    icons: [
      {
        src: brandConfig.brand.logo.icon,
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
