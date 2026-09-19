import { brandConfig } from "@/config/brandConfig";

export type OrderDeadlineStatus = "open" | "closing-soon" | "last-day" | "closed";
export type OrderDeadlineUrgency = "calm" | "warm" | "amber" | "red" | "closed";

export interface OrderDeadlineResult {
  status: OrderDeadlineStatus;
  urgency: OrderDeadlineUrgency;
  msRemaining: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isClosed: boolean;
}

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

// Thresholds per PRD specification:
// - > 14 days: calm (open)
// - <= 7 days: warm (open)
// - <= 72 hours: amber (closing-soon)
// - <= 24 hours: red and pulsing (last-day)
// - <= 0: closed
const THRESHOLD_24_HOURS = 24 * MS_PER_HOUR;
const THRESHOLD_72_HOURS = 72 * MS_PER_HOUR;
const THRESHOLD_7_DAYS = 7 * MS_PER_DAY;

/**
 * Pure helper to compute the countdown time left, status and urgency.
 * Evaluates targetIso against now (epoch ms or Date).
 *
 * All inputs are evaluated with exact UTC epoch offsets from the ISO 8601
 * string (+05:30 for Asia/Kolkata), completely agnostic of the user browser's
 * local machine timezone.
 */
export function getOrderDeadlineStatus(
  targetIso: string = brandConfig.orderDeadline.iso,
  now?: Date | number,
): OrderDeadlineResult {
  const targetMs = typeof targetIso === "string" ? Date.parse(targetIso) : NaN;
  const currentMs =
    now instanceof Date
      ? now.getTime()
      : typeof now === "number"
        ? now
        : Date.now();

  if (Number.isNaN(targetMs)) {
    return {
      status: "closed",
      urgency: "closed",
      msRemaining: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isClosed: true,
    };
  }

  const msRemaining = Math.max(0, targetMs - currentMs);

  if (msRemaining <= 0) {
    return {
      status: "closed",
      urgency: "closed",
      msRemaining: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isClosed: true,
    };
  }

  const totalSeconds = Math.floor(msRemaining / MS_PER_SECOND);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let status: OrderDeadlineStatus = "open";
  let urgency: OrderDeadlineUrgency = "calm";

  if (msRemaining <= THRESHOLD_24_HOURS) {
    status = "last-day";
    urgency = "red";
  } else if (msRemaining <= THRESHOLD_72_HOURS) {
    status = "closing-soon";
    urgency = "amber";
  } else if (msRemaining <= THRESHOLD_7_DAYS) {
    status = "open";
    urgency = "warm";
  } else {
    status = "open";
    urgency = "calm";
  }

  return {
    status,
    urgency,
    msRemaining,
    days,
    hours,
    minutes,
    seconds,
    isClosed: false,
  };
}

/**
 * Server and client guard to test whether submissions are blocked.
 * Only blocks when `enabled === true` AND `blockAfterDeadline === true`.
 */
export function isOrderDeadlineBlocked(now?: Date | number): boolean {
  if (!brandConfig.orderDeadline.enabled || !brandConfig.orderDeadline.blockAfterDeadline) {
    return false;
  }
  return getOrderDeadlineStatus(brandConfig.orderDeadline.iso, now).isClosed;
}

/**
 * Generates an accessible, non-ticking screen-reader announcement string
 * that changes at most once per minute.
 */
export function formatAccessibleAnnouncement(days: number, hours: number, minutes: number): string {
  if (days === 0 && hours === 0 && minutes === 0) {
    return "Order deadline is imminent — less than one minute remaining.";
  }
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  if (hours > 0 || days > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  return `Order deadline: ${parts.join(", ")} remaining.`;
}
