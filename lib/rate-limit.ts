import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * §30.2: /api/enquiry 5/IP/10min + 20/IP/day, /api/track 60/IP/min.
 * No-ops (never blocks) when Upstash env vars are absent — e.g. local dev —
 * rather than failing closed and taking the whole enquiry flow down.
 */
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const enquiryPer10Min = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "10 m"), prefix: "dc:enquiry:10m" })
  : null;
const enquiryPerDay = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 d"), prefix: "dc:enquiry:1d" })
  : null;
const trackPerMinute = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "1 m"), prefix: "dc:track:1m" })
  : null;

export async function checkEnquiryRateLimit(ip: string): Promise<{ allowed: boolean }> {
  if (!enquiryPer10Min || !enquiryPerDay) return { allowed: true };
  const [short, long] = await Promise.all([enquiryPer10Min.limit(ip), enquiryPerDay.limit(ip)]);
  return { allowed: short.success && long.success };
}

export async function checkTrackRateLimit(ip: string): Promise<{ allowed: boolean }> {
  if (!trackPerMinute) return { allowed: true };
  const result = await trackPerMinute.limit(ip);
  return { allowed: result.success };
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
