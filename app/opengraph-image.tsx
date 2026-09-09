import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded default OG image (§28.3) — every WhatsApp share renders this unless a page overrides it. */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#7A1F2B",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700 }}>{siteConfig.name}</div>
        <div style={{ fontSize: 32, marginTop: 20, color: "#F5D9A8" }}>{siteConfig.tagline}</div>
      </div>
    ),
    size,
  );
}
