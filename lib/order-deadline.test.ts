import { describe, expect, it } from "vitest";
import {
  formatAccessibleAnnouncement,
  getOrderDeadlineStatus,
  isOrderDeadlineBlocked,
} from "./order-deadline";

describe("getOrderDeadlineStatus", () => {
  const deadlineIso = "2026-10-18T23:59:59+05:30";
  const deadlineMs = Date.parse(deadlineIso);

  it("handles far future (> 14 days) with calm status", () => {
    // 20 days before
    const now = deadlineMs - 20 * 24 * 60 * 60 * 1000;
    const res = getOrderDeadlineStatus(deadlineIso, now);

    expect(res.status).toBe("open");
    expect(res.urgency).toBe("calm");
    expect(res.isClosed).toBe(false);
    expect(res.days).toBe(20);
    expect(res.hours).toBe(0);
    expect(res.minutes).toBe(0);
    expect(res.seconds).toBe(0);
  });

  it("handles exactly 14 days before deadline", () => {
    const now = deadlineMs - 14 * 24 * 60 * 60 * 1000;
    const res = getOrderDeadlineStatus(deadlineIso, now);

    expect(res.status).toBe("open");
    expect(res.urgency).toBe("calm");
    expect(res.days).toBe(14);
  });

  it("handles exactly 7 days before deadline with warm status", () => {
    const now = deadlineMs - 7 * 24 * 60 * 60 * 1000;
    const res = getOrderDeadlineStatus(deadlineIso, now);

    expect(res.status).toBe("open");
    expect(res.urgency).toBe("warm");
    expect(res.days).toBe(7);
  });

  it("handles exactly 3 days (72 hours) before deadline with closing-soon / amber status", () => {
    const now = deadlineMs - 72 * 60 * 60 * 1000;
    const res = getOrderDeadlineStatus(deadlineIso, now);

    expect(res.status).toBe("closing-soon");
    expect(res.urgency).toBe("amber");
    expect(res.days).toBe(3);
    expect(res.hours).toBe(0);
  });

  it("handles exactly 1 day (24 hours) before deadline with last-day / red status", () => {
    const now = deadlineMs - 24 * 60 * 60 * 1000;
    const res = getOrderDeadlineStatus(deadlineIso, now);

    expect(res.status).toBe("last-day");
    expect(res.urgency).toBe("red");
    expect(res.days).toBe(1);
    expect(res.hours).toBe(0);
  });

  it("handles exactly 1 second before deadline", () => {
    const now = deadlineMs - 1000;
    const res = getOrderDeadlineStatus(deadlineIso, now);

    expect(res.status).toBe("last-day");
    expect(res.urgency).toBe("red");
    expect(res.isClosed).toBe(false);
    expect(res.days).toBe(0);
    expect(res.hours).toBe(0);
    expect(res.minutes).toBe(0);
    expect(res.seconds).toBe(1);
  });

  it("handles exactly at deadline (0 ms remaining)", () => {
    const res = getOrderDeadlineStatus(deadlineIso, deadlineMs);

    expect(res.status).toBe("closed");
    expect(res.urgency).toBe("closed");
    expect(res.isClosed).toBe(true);
    expect(res.msRemaining).toBe(0);
    expect(res.days).toBe(0);
    expect(res.hours).toBe(0);
    expect(res.minutes).toBe(0);
    expect(res.seconds).toBe(0);
  });

  it("handles after deadline", () => {
    const now = deadlineMs + 5000;
    const res = getOrderDeadlineStatus(deadlineIso, now);

    expect(res.status).toBe("closed");
    expect(res.urgency).toBe("closed");
    expect(res.isClosed).toBe(true);
    expect(res.msRemaining).toBe(0);
  });

  it("correctly handles IST offset vs UTC input", () => {
    // 2026-10-18T23:59:59+05:30 is equivalent to 2026-10-18T18:29:59.000Z
    const istMs = Date.parse("2026-10-18T23:59:59+05:30");
    const utcMs = Date.parse("2026-10-18T18:29:59.000Z");
    expect(istMs).toBe(utcMs);

    // 10 minutes before via UTC Date
    const nowUtc = new Date("2026-10-18T18:19:59.000Z");
    const res = getOrderDeadlineStatus(deadlineIso, nowUtc);
    expect(res.status).toBe("last-day");
    expect(res.minutes).toBe(10);
    expect(res.seconds).toBe(0);
  });

  it("gracefully handles invalid target ISO", () => {
    const res = getOrderDeadlineStatus("invalid-date", Date.now());
    expect(res.status).toBe("closed");
    expect(res.isClosed).toBe(true);
  });
});

describe("isOrderDeadlineBlocked", () => {
  it("does not block when blockAfterDeadline is false in config", () => {
    // brandConfig.orderDeadline.blockAfterDeadline is false by default
    const farFuture = Date.now() + 100000000000;
    expect(isOrderDeadlineBlocked(farFuture)).toBe(false);
  });
});

describe("formatAccessibleAnnouncement", () => {
  it("formats accessible announcement correctly", () => {
    expect(formatAccessibleAnnouncement(5, 4, 3)).toBe("Order deadline: 5 days, 4 hours, 3 minutes remaining.");
    expect(formatAccessibleAnnouncement(1, 1, 1)).toBe("Order deadline: 1 day, 1 hour, 1 minute remaining.");
    expect(formatAccessibleAnnouncement(0, 0, 15)).toBe("Order deadline: 15 minutes remaining.");
    expect(formatAccessibleAnnouncement(0, 0, 0)).toBe("Order deadline is imminent — less than one minute remaining.");
  });
});
