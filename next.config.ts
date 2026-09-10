import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    // Local Supabase Storage serves from 127.0.0.1, a private IP — Next.js
    // blocks image optimization from private IPs by default (SSRF
    // protection). Production Storage is at https://*.supabase.co (a public
    // host), so this only matters for local dev.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "54321" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
