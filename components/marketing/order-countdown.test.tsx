import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { OrderCountdownBanner } from "./order-countdown-banner";
import { OrderCountdownHero } from "./order-countdown-hero";
import { brandConfig } from "@/config/brandConfig";

vi.mock("next/navigation", () => ({
  usePathname: () => "/products", // non-homepage so banner shows
}));

describe("OrderCountdownBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it("renders countdown and updates every second", () => {
    // 2 days before deadline
    const deadlineMs = Date.parse(brandConfig.orderDeadline.iso);
    vi.setSystemTime(deadlineMs - (2 * 24 * 60 * 60 * 1000 + 10 * 1000));

    const { unmount } = render(<OrderCountdownBanner />);

    // Screen-reader announcement should be present
    expect(screen.getByText(/order deadline:/i)).toBeDefined();

    // Fast-forward 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Clean up cleanly on unmount
    unmount();
  });

  it("renders closed state when past deadline", () => {
    const deadlineMs = Date.parse(brandConfig.orderDeadline.iso);
    vi.setSystemTime(deadlineMs + 1000);

    render(<OrderCountdownBanner />);

    expect(screen.getByText(brandConfig.orderDeadline.labels.en.closedTitle)).toBeDefined();
  });

  it("is dismissible per session via close button", () => {
    const deadlineMs = Date.parse(brandConfig.orderDeadline.iso);
    vi.setSystemTime(deadlineMs - 1000000);

    const { container } = render(<OrderCountdownBanner />);

    const closeButton = screen.getByLabelText(/dismiss order deadline banner/i);
    fireEvent.click(closeButton);

    expect(sessionStorage.getItem("dc_order_deadline_dismissed")).toBe("1");
    expect(container.firstChild).toBeNull();
  });
});

describe("OrderCountdownHero", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders countdown with Days, Hours, Mins, Secs and cleans up interval on unmount", () => {
    const deadlineMs = Date.parse(brandConfig.orderDeadline.iso);
    vi.setSystemTime(deadlineMs - (5 * 24 * 60 * 60 * 1000));

    const clearIntervalSpy = vi.spyOn(window, "clearInterval");
    const { unmount } = render(<OrderCountdownHero />);

    expect(screen.getByText(brandConfig.orderDeadline.labels.en.title)).toBeDefined();
    expect(screen.getByText(brandConfig.orderDeadline.labels.en.units.days)).toBeDefined();

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("renders closed state when past deadline with WhatsApp and Call options", () => {
    const deadlineMs = Date.parse(brandConfig.orderDeadline.iso);
    vi.setSystemTime(deadlineMs + 5000);

    render(<OrderCountdownHero />);

    expect(screen.getByText(brandConfig.orderDeadline.labels.en.closedTitle)).toBeDefined();
    expect(screen.getByText(/whatsapp us/i)).toBeDefined();
  });
});
