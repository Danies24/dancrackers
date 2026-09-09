"use client";

/**
 * GA4 event helpers (§29.2). Every call no-ops safely if GA4 hasn't loaded
 * (no measurement ID configured, ad blocker, etc.) — analytics must never
 * throw and break the page it's instrumenting.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  try {
    window.gtag?.("event", name, params);
  } catch {
    // never let analytics break the page
  }
}

/** Set once per session on referral landing so every later event carries it (§29.2). */
export function setCaptainCodeProperty(code: string): void {
  try {
    window.gtag?.("set", "user_properties", { captain_code: code });
  } catch {
    // no-op
  }
}
