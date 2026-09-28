import "server-only";
import { randomUUID } from "crypto";
import { redis } from "@/lib/redis";
import { CART_TTL_DAYS } from "@/lib/cart";
import type { ShareCartItem } from "@/lib/cart-share";

/**
 * KV fallback for a shared-cart link that would otherwise exceed
 * SHARE_URL_LENGTH_LIMIT (lib/cart-share.ts) — the compact ?s=&i= format is
 * always preferred; this only kicks in for very long carts (60+ items).
 * Returns null when Redis isn't configured (matches lib/rate-limit.ts's
 * no-op convention) — the caller falls back to "copy as text" instead.
 */
const KEY_PREFIX = "dc:cart-share:";
const TTL_SECONDS = CART_TTL_DAYS * 24 * 60 * 60;

export interface StoredSharedCart {
  shopSlug: string;
  items: ShareCartItem[];
}

export async function putSharedCart(cart: StoredSharedCart): Promise<string | null> {
  if (!redis) return null;
  const id = randomUUID().replace(/-/g, "").slice(0, 12);
  await redis.set(`${KEY_PREFIX}${id}`, cart, { ex: TTL_SECONDS });
  return id;
}

export async function getSharedCart(id: string): Promise<StoredSharedCart | null> {
  if (!redis || !/^[a-f0-9]{1,32}$/.test(id)) return null;
  const data = await redis.get<StoredSharedCart>(`${KEY_PREFIX}${id}`);
  return data ?? null;
}
