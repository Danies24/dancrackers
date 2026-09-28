import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Client-side Router Cache TTLs (Swiggy-redesign plan's performance
    // practices) — a shop PLP/category page tapped again within 30s (e.g.
    // via back-navigation from a product) reuses the cached RSC payload
    // instead of a fresh fetch; static/ISR pages get a longer window since
    // their own `revalidate` already governs server-side freshness.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  images: {
    // Product photos rarely change once uploaded (each upload gets a new
    // timestamped path) — cache Vercel's optimized copies for a long time
    // instead of the framework default.
    minimumCacheTTL: 31536000,
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
  async redirects() {
    // Product detail pages moved under /s/[shopSlug]/p/[slug] (multi-shop
    // spec §5.1) — every slug that existed before this move belongs to Sri
    // Ram (the only shop with a catalogue until this release), so a flat
    // rewrite to its equivalent is always correct, no DB lookup needed.
    const redirects = [
      {
        source: "/product/:slug",
        destination: "/s/sri-ram-crackers/p/:slug",
        permanent: true,
      },
    ];

    const canonicalHost = process.env.NEXT_PUBLIC_CANONICAL_HOST?.trim();
    if (!canonicalHost) {
      return redirects;
    }

    // Permanent (308) redirect from non-canonical hosts to canonical host
    const escapedCanonical = canonicalHost.replace(/\./g, "\\.");
    return [
      ...redirects,
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: `^(?!${escapedCanonical}$)(?!localhost(?::\\d+)?$).*`,
          },
        ],
        destination: `https://${canonicalHost}/:path*`,
        permanent: true,
      },
    ];
  },

  async headers() {
    const headersList = [];

    // Block indexing on all non-production Vercel deployments (Preview, Development)
    if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
      headersList.push({
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      });
    }

    // Private transactional & administrative routes must never be indexed.
    // Serving them with an X-Robots-Tag header (while keeping them crawlable in robots.txt)
    // allows search engine bots to crawl the URL, read the noindex directive, and drop the URL from the index.
    const privateRoutes = [
      "/admin/:path*",
      "/cart/:path*",
      "/enquiry/:path*",
      "/captain/:path*",
      "/c/:path*",
    ];

    for (const route of privateRoutes) {
      headersList.push({
        source: route,
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      });
    }

    return headersList;
  },
};

export default nextConfig;
