/**
 * Season switch. The whole site is closed (showing /closed) unless the env
 * var SITE_CLOSED is exactly "false" — so a typo keeps it closed, never
 * accidentally open. To reopen for Diwali: set SITE_CLOSED=false in Vercel
 * and redeploy; (optionally) DIGEST_ENABLED=true plus the crons in
 * vercel.json for the daily digest. See README "Season switch".
 */
export function isSiteClosed(): boolean {
  return process.env.SITE_CLOSED !== "false";
}

/** Order/enquiry/tracking writes — blocked with a 503 while closed. */
export const CLOSED_API_PATHS = ["/api/enquiry", "/api/general-enquiry", "/api/cart/share", "/api/track"];

/** Legal pages stay reachable while closed (ad/payment reviews, links in old messages). */
export const CLOSED_OPEN_PAGES = ["/terms", "/privacy", "/compliance"];

/** Closed-state responses carry this so search engines treat it as temporary. */
export const CLOSED_RETRY_AFTER_SECONDS = 60 * 60 * 24 * 7;
