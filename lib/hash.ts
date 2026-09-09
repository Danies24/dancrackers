import "server-only";
import { createHash } from "node:crypto";

/** IP addresses are stored as a salted hash, never raw (§30.2). */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "dev-salt-change-in-production";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
