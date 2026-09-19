"use client";

import { useEffect, useState } from "react";
import { Clock, Phone, MessageCircle } from "lucide-react";
import { brandConfig, getPhoneDisplay, getPhoneE164, getWhatsAppLink } from "@/config/brandConfig";
import {
  formatAccessibleAnnouncement,
  getOrderDeadlineStatus,
  type OrderDeadlineResult,
} from "@/lib/order-deadline";
import { trackCountdownView } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function OrderCountdownHero() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());

  const config = brandConfig.orderDeadline;

  useEffect(() => {
    setMounted(true);
    if (!config.enabled) return;

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

  if (!config.enabled) return null;

  // Stable server placeholder to prevent layout shift and hydration mismatches
  if (!mounted) {
    return (
      <div className="mx-auto mt-6 w-full max-w-md rounded-2xl border border-border bg-surface/90 p-4 shadow-soft">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-ink-soft">
          <Clock size={15} className="text-maroon-ink" aria-hidden="true" />
          <span>{config.labels.en.title}</span>
          <span className="text-muted">·</span>
          <span lang="ta">{config.labels.ta.title}</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {["Days", "Hours", "Mins", "Secs"].map((label) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center rounded-xl border border-border bg-cream py-2"
            >
              <span className="font-mono text-xl font-bold text-ink">--</span>
              <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const result: OrderDeadlineResult = getOrderDeadlineStatus(config.iso, now);
  const { isClosed, urgency, days, hours, minutes, seconds } = result;
  const en = config.labels.en;
  const ta = config.labels.ta;

  const accessibleText = isClosed
    ? `${en.closedTitle}. ${ta.closedTitle}.`
    : formatAccessibleAnnouncement(days, hours, minutes);

  // Urgency styling variants
  const cardBorderStyles = {
    calm: "border-border bg-surface/90",
    warm: "border-amber/40 bg-surface/90 shadow-soft",
    amber: "border-amber/60 bg-amber/5 shadow-soft",
    red: "border-red/60 bg-red/5 shadow-soft-lg ring-1 ring-red/30",
    closed: "border-border bg-surface/90",
  };

  const badgeStyles = {
    calm: "bg-gold-tint text-gold-ink border-border",
    warm: "bg-amber/15 text-amber-ink border-amber/30",
    amber: "bg-amber/20 text-amber-ink border-amber/40",
    red: "bg-red text-white border-red font-bold motion-safe:animate-pulse",
    closed: "bg-surface text-muted border-border",
  };

  const timeUnits = [
    { value: days, enLabel: en.units.days, taLabel: ta.units.days },
    { value: hours, enLabel: en.units.hours, taLabel: ta.units.hours },
    { value: minutes, enLabel: en.units.minutes, taLabel: ta.units.minutes },
    { value: seconds, enLabel: en.units.seconds, taLabel: ta.units.seconds },
  ];

  return (
    <div
      aria-label="Order deadline countdown"
      className={cn(
        "mx-auto mt-6 w-full max-w-md rounded-2xl border p-4 text-center transition-all duration-300",
        cardBorderStyles[urgency],
      )}
    >
      {/* Screen reader polite status */}
      <span className="sr-only" aria-live="polite">
        {accessibleText}
      </span>

      {isClosed ? (
        <div className="py-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
            <Clock size={13} aria-hidden="true" />
            <span>{en.closedTitle}</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-ink">{ta.closedTitle}</p>
          <p className="mt-1 text-xs text-ink-soft">{en.closedMessage}</p>

          <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-whatsapp px-4 text-xs font-bold text-white transition-opacity hover:opacity-90 sm:w-auto"
            >
              <MessageCircle size={15} aria-hidden="true" />
              <span>WhatsApp Us</span>
            </a>
            <a
              href={`tel:+${getPhoneE164()}`}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-xs font-semibold text-ink transition-colors hover:border-maroon hover:text-maroon-ink sm:w-auto"
            >
              <Phone size={14} aria-hidden="true" />
              <span>{getPhoneDisplay()}</span>
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold",
                badgeStyles[urgency],
              )}
            >
              <Clock size={13} aria-hidden="true" />
              <span>{en.title}</span>
            </span>
            <span className="text-xs font-medium text-ink-soft" lang="ta">
              {ta.title}
            </span>
          </div>

          <div aria-hidden="true" className="mt-3.5 grid grid-cols-4 gap-2">
            {timeUnits.map((u, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border bg-cream py-2 shadow-sm transition-colors",
                  urgency === "red" ? "border-red/40" : "border-border",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-2xl font-bold tabular-nums",
                    urgency === "red" ? "text-red" : "text-ink",
                  )}
                >
                  {String(u.value).padStart(2, "0")}
                </span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {u.enLabel}
                </span>
                <span className="text-[9px] text-ink-soft" lang="ta">
                  {u.taLabel}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
