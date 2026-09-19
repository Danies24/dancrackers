"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Clock, Phone, MessageCircle } from "lucide-react";
import { brandConfig, getPhoneDisplay, getPhoneE164, getWhatsAppLink } from "@/config/brandConfig";
import {
  formatAccessibleAnnouncement,
  getOrderDeadlineStatus,
  type OrderDeadlineResult,
} from "@/lib/order-deadline";
import { trackCountdownView } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const DISMISS_SESSION_KEY = "dc_order_deadline_dismissed";

export function OrderCountdownBanner() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());

  const config = brandConfig.orderDeadline;

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_SESSION_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      // sessionStorage unavailable
    }
    setMounted(true);

    if (!config.enabled) return;

    // Track countdown view once per session
    const initialStatus = getOrderDeadlineStatus(config.iso);
    trackCountdownView(initialStatus.urgency);

    let timer: ReturnType<typeof setInterval> | null = null;

    function startTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        setNow(Date.now());
      }, 1000);
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        stopTimer();
      } else {
        setNow(Date.now());
        startTimer();
      }
    }

    if (!document.hidden) {
      startTimer();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [config.enabled, config.iso]);

  function handleDismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_SESSION_KEY, "1");
    } catch {
      // sessionStorage unavailable
    }
  }

  // Feature disabled
  if (!config.enabled) return null;

  // Don't duplicate full countdown on homepage where hero countdown lives
  if (pathname === "/") return null;

  // Dismissed by user in this session
  if (dismissed) return null;

  // Stable server placeholder to prevent layout shift and hydration mismatches
  if (!mounted) {
    return (
      <aside
        aria-label="Order deadline notice"
        className="relative z-50 flex min-h-[38px] w-full items-center justify-center border-b border-border bg-cream px-3 py-1.5 text-xs text-ink"
      >
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-maroon-ink" aria-hidden="true" />
          <span className="font-semibold">{config.labels.en.title}</span>
          <span className="text-muted">·</span>
          <span className="text-ink-soft" lang="ta">
            {config.labels.ta.title}
          </span>
        </div>
      </aside>
    );
  }

  const result: OrderDeadlineResult = getOrderDeadlineStatus(config.iso, now);
  const { isClosed, urgency, days, hours, minutes, seconds } = result;
  const en = config.labels.en;
  const ta = config.labels.ta;

  // Visual styling variants by urgency level
  const urgencyStyles = {
    calm: "bg-cream border-border text-ink",
    warm: "bg-amber/10 border-amber/30 text-ink",
    amber: "bg-amber/15 border-amber/40 text-ink",
    red: "bg-red/10 border-red/30 text-ink",
    closed: "bg-surface border-border text-ink-soft",
  };

  const badgeStyles = {
    calm: "bg-gold-tint text-gold-ink border-border",
    warm: "bg-amber/20 text-amber-ink border-amber/30",
    amber: "bg-amber/25 text-amber-ink border-amber/40 font-semibold",
    red: "bg-red/20 text-red border-red/30 font-bold motion-safe:animate-pulse",
    closed: "bg-surface text-muted border-border",
  };

  const accessibleText = isClosed
    ? `${en.closedTitle}. ${ta.closedTitle}.`
    : formatAccessibleAnnouncement(days, hours, minutes);

  return (
    <aside
      aria-label="Order deadline countdown"
      className={cn(
        "relative z-50 flex min-h-[38px] w-full items-center justify-between border-b px-2.5 py-1.5 text-xs transition-colors duration-300 sm:px-4",
        urgencyStyles[urgency],
      )}
    >
      {/* Screen-reader polite updates (at most once per minute) */}
      <span className="sr-only" aria-live="polite">
        {accessibleText}
      </span>

      <div className="mx-auto flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 pr-6 sm:pr-0">
        <div className="flex items-center gap-1.5">
          <Clock
            size={14}
            className={cn("shrink-0", urgency === "red" ? "text-red" : "text-maroon-ink")}
            aria-hidden="true"
          />
          <span className="font-bold tracking-tight">
            {isClosed ? en.closedTitle : en.title}
          </span>
          <span className="hidden text-muted md:inline">·</span>
          <span className="hidden text-[11px] text-ink-soft md:inline" lang="ta">
            {isClosed ? ta.closedTitle : ta.title}
          </span>
        </div>

        {isClosed ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted">
              Call / WhatsApp:
            </span>
            <a
              href={`tel:+${getPhoneE164()}`}
              className="inline-flex items-center gap-1 font-semibold text-maroon-ink hover:underline"
            >
              <Phone size={12} aria-hidden="true" />
              <span>{getPhoneDisplay()}</span>
            </a>
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-whatsapp hover:underline"
            >
              <MessageCircle size={12} aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
          </div>
        ) : (
          <div
            aria-hidden="true"
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-mono tabular-nums",
              badgeStyles[urgency],
            )}
          >
            <span>
              <strong>{days}</strong>
              <span className="text-[10px] text-muted">{en.shortUnits.d}</span>
            </span>
            <span className="opacity-60">:</span>
            <span>
              <strong>{String(hours).padStart(2, "0")}</strong>
              <span className="text-[10px] text-muted">{en.shortUnits.h}</span>
            </span>
            <span className="opacity-60">:</span>
            <span>
              <strong>{String(minutes).padStart(2, "0")}</strong>
              <span className="text-[10px] text-muted">{en.shortUnits.m}</span>
            </span>
            <span className="opacity-60">:</span>
            <span>
              <strong>{String(seconds).padStart(2, "0")}</strong>
              <span className="text-[10px] text-muted">{en.shortUnits.s}</span>
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss order deadline banner"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </aside>
  );
}
