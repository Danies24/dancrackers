import type { MetadataRoute } from "next";
import { brandConfig } from "@/config/brandConfig";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brandConfig.brand.name} (${brandConfig.brand.nameTamil}) — Sivakasi Crackers`,
    short_name: brandConfig.brand.name,
    description: brandConfig.seo.defaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#FFFBF2",
    theme_color: "#7A1F2B",
    icons: [
      {
        src: brandConfig.brand.logo.icon,
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
