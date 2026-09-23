"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

const STORAGE_PREFIX = "kg_collapsed_";

/**
 * A generic header+chevron collapsible, used for each of the shop PLP's
 * per-category sections. Collapsed state persists per `storageKey` in
 * sessionStorage (survives a back-navigation within the tab, cleared on a
 * fresh visit) — a per-viewer convenience, never state read back by the app.
 */
export function CollapsibleSection({
  storageKey,
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  storageKey: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_PREFIX + storageKey);
      if (saved === "closed") setOpen(false);
      else if (saved === "open") setOpen(true);
    } catch {
      // Per-viewer convenience only — a blocked/unavailable sessionStorage just means no persistence.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(STORAGE_PREFIX + storageKey, next ? "open" : "closed");
      } catch {
        // Same as above — best effort only.
      }
      return next;
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-1 text-left"
      >
        <span>
          <span className="font-display text-base font-bold text-ink">{title}</span>
          {subtitle && <span className="ml-1.5 text-xs font-medium text-muted">{subtitle}</span>}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-muted transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
