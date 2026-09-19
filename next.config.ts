import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
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
    const canonicalHost = process.env.NEXT_PUBLIC_CANONICAL_HOST?.trim();
    if (!canonicalHost) {
      return [];
    }

    // Permanent (308) redirect from non-canonical hosts to canonical host
    const escapedCanonical = canonicalHost.replace(/\./g, "\\.");
    return [
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
