import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "54321" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
