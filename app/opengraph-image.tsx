import { ImageResponse } from "next/og";
import { brandConfig } from "@/config/brandConfig";

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
          padding: "40px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ fontSize: 76, fontWeight: 700, color: "#FFFFFF" }}>{brandConfig.brand.name}</span>
          <span style={{ fontSize: 44, fontWeight: 600, color: "#F5D9A8" }}>({brandConfig.brand.nameTamil})</span>
        </div>
        <div style={{ display: "flex", fontSize: 32, marginTop: 24, color: "#F5D9A8", fontWeight: 600, maxWidth: 900 }}>
          {brandConfig.brand.tagline}
        </div>
        <div style={{ display: "flex", fontSize: 22, marginTop: 16, color: "rgba(255,255,255,0.8)" }}>
          {brandConfig.brand.descriptor} • Diwali 2026 Price List & Enquiries
        </div>
      </div>
    ),
    size,
  );
}
