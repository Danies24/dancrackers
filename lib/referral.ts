/**
 * Captain attribution (PRD §20.4). Client-side only — reads/writes
 * localStorage. 30-day window, last-click wins, silent on any failure.
 */

const STORAGE_KEY = "dc_ref";
const WINDOW_DAYS = 30;
const CODE_PATTERN = /^[A-Z]{3}[0-9]{2}$/;

interface StoredRef {
  code: string;
  at: number;
}

function readStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Normalizes and validates a code's *shape* — not whether a captain exists (§20.6). */
export function normalizeCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

/** Called from /c/[code]. Overwrites any prior code — last click wins (§20.4). */
export function captureReferral(rawCode: string): void {
  const storage = readStorage();
  if (!storage) return;
  const code = rawCode.trim().toUpperCase();
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ code, at: Date.now() } satisfies StoredRef));
  } catch {
    // localStorage unavailable (private mode) — attribution is lost, silently (§20.6, §33 case 23).
  }
}

/** Read at enquiry submission time. Returns null if absent, malformed, or expired. */
export function getReferral(): string | null {
  const storage = readStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredRef>;
    if (!parsed?.code || typeof parsed.at !== "number") return null;
    const ageDays = (Date.now() - parsed.at) / 86_400_000;
    if (ageDays > WINDOW_DAYS || ageDays < 0) return null;
    return parsed.code;
  } catch {
    return null;
  }
}

export function clearReferral(): void {
  const storage = readStorage();
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
