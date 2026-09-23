"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFocusTrap } from "@/components/ui/use-focus-trap";

const EXIT_DURATION_MS = 260;
const DRAG_CLOSE_DISTANCE = 120;
const DRAG_CLOSE_VELOCITY = 0.5; // px/ms

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** "bottom": slides up from the bottom on mobile, centered modal on desktop. "center-only": always centered, no drag handle. */
  variant?: "bottom" | "center-only";
  maxHeight?: string;
  ariaLabel: string;
  /** Defaults to true for variant="bottom", false for "center-only". */
  dragToClose?: boolean;
  /**
   * Fires once the sheet has fully unmounted and its body-scroll lock is
   * released — not at the moment `onClose` is called. A consumer that needs
   * to do something to the page behind the sheet as a result of closing it
   * (scrollIntoView, navigation) must defer that action to here: doing it
   * synchronously inside the row's own click handler runs while `rendered`
   * is still true and body scroll is still locked, so a `scrollIntoView`
   * call there is silently a no-op (a real bug hit building the shop PLP's
   * MENU sheet — see components/shop/shop-menu-fab.tsx).
   */
  onExited?: () => void;
}

/**
 * The one shared modal/sheet primitive (Swiggy-redesign plan) — replaces
 * three previously hand-rolled, inconsistent implementations
 * (start-new-cart-sheet.tsx, the header's nav drawer, product-gallery.tsx's
 * lightbox) with one that has focus-trap, scrollbar-compensated body-scroll
 * lock, ESC/backdrop close, and back-button close, all in one place.
 */
export function Sheet({
  open,
  onClose,
  children,
  variant = "bottom",
  maxHeight = "85vh",
  ariaLabel,
  dragToClose = variant === "bottom",
  onExited,
}: SheetProps) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startTime: number; lastY: number; lastTime: number } | null>(null);

  useFocusTrap(panelRef, open);

  // Adjusting state during render (React's documented pattern for "a prop
  // changed") rather than in an effect body, so the exit-animation kickoff
  // below never fires a synchronous setState-in-effect. Keeps the panel
  // mounted for one exit-animation cycle after `open` goes false, instead
  // of unmounting instantly and skipping the close motion.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setRendered(true);
      setClosing(false);
    } else if (rendered) {
      setClosing(true);
    }
  }

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => {
      setRendered(false);
      setClosing(false);
      onExited?.();
    }, EXIT_DURATION_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing]);

  // Body scroll lock, compensated for the scrollbar's own width so desktop
  // layout doesn't shift when it disappears — a gap product-gallery.tsx's
  // lightbox has today (no compensation there at all).
  useEffect(() => {
    if (!rendered) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [rendered]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Back-button closes the sheet instead of leaving the page — one history
  // entry pushed on open, popped (by the browser) on close. Never call
  // history.back() from inside the popstate handler itself — that's what
  // causes the classic double-pop bug.
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ kgSheet: true }, "");
    function onPopState() {
      onClose();
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handlePointerMove(e: PointerEvent) {
    const drag = dragRef.current;
    const panel = panelRef.current;
    if (!drag || !panel) return;
    const delta = Math.max(0, e.clientY - drag.startY);
    panel.style.transform = `translateY(${delta}px)`;
    drag.lastY = e.clientY;
    drag.lastTime = performance.now();
  }

  function handlePointerUp(e: PointerEvent) {
    const drag = dragRef.current;
    const panel = panelRef.current;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    dragRef.current = null;
    if (!drag || !panel) return;
    const distance = Math.max(0, e.clientY - drag.startY);
    const elapsed = Math.max(1, drag.lastTime - drag.startTime);
    const velocity = distance / elapsed;
    if (distance > DRAG_CLOSE_DISTANCE || velocity > DRAG_CLOSE_VELOCITY) {
      onClose();
      return;
    }
    panel.style.transition = "transform 200ms ease-out";
    panel.style.transform = "";
    setTimeout(() => {
      if (panelRef.current) panelRef.current.style.transition = "";
    }, 200);
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragRef.current = { startY: e.clientY, startTime: performance.now(), lastY: e.clientY, lastTime: performance.now() };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  if (!rendered) return null;

  const isBottom = variant === "bottom";

  return (
    <div
      className={`fixed inset-0 z-[70] flex justify-center ${isBottom ? "items-end md:items-center" : "items-center"}`}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`absolute inset-0 bg-black/50 ${closing ? "sheet-backdrop-exit" : "sheet-backdrop-enter"}`}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight }}
        className={`relative flex w-full max-w-md flex-col overflow-y-auto border border-border bg-surface shadow-lg ${
          isBottom ? "rounded-t-3xl md:rounded-3xl" : "rounded-3xl"
        } ${closing ? "sheet-exit" : "sheet-enter"}`}
      >
        {isBottom && dragToClose && (
          <div
            className="sticky top-0 z-10 flex cursor-grab touch-none justify-center bg-surface py-2.5 active:cursor-grabbing md:hidden"
            onPointerDown={handlePointerDown}
          >
            <span className="h-1 w-10 rounded-full bg-border" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
