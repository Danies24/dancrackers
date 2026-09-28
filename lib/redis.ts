import "server-only";
import { Redis } from "@upstash/redis";

/**
 * The one Upstash Redis client for the app — rate limiting (lib/rate-limit.ts)
 * and the shared-cart short-link store (lib/cart-share-store.ts) both import
 * this instead of constructing their own. null (no-op) when the env vars
 * are absent, e.g. local dev — callers must handle that, never fail closed.
 */
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;
