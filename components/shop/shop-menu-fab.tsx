"use client";

import { useRef, useState } from "react";
import { List } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";

export interface ShopMenuSection {
  anchorId: string;
  label: string;
  count: number;
}

/**
 * The floating MENU button + its jump-to-section sheet (Swiggy-redesign
 * plan) — built on the shared Sheet primitive. The list itself must be the
 * thing that scrolls (there are ~20 sections, far more than fit in one
 * screen) — Sheet's own panel already clips a full-bleed child to its
 * rounded corners on its own (setting only overflow-y leaves overflow-x at
 * its default "visible", which the CSS spec resolves to "auto" too the
 * moment any other axis is non-visible, so the panel effectively clips
 * both axes already). An earlier version wrapped the content in its own
 * `overflow-hidden` div to "fix" the corners — that was never needed and
 * silently clipped ~280px of real content that the list's own scroll could
 * never reach; removed.
 */
export function ShopMenuFab({
  sections,
  activeAnchorId,
  onSelect,
}: {
  sections: ShopMenuSection[];
  activeAnchorId: string | null;
  onSelect: (anchorId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  // scrollIntoView must wait until the sheet has actually unmounted and
  // released its body-scroll lock (Sheet's onExited) — calling it the
  // instant a row is tapped is a silent no-op while the sheet is still
  // closing (see the note on Sheet's onExited prop).
  const pendingAnchorRef = useRef<string | null>(null);

  if (sections.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-3.5 z-40 flex h-[52px] w-[52px] flex-col items-center justify-center gap-0.5 rounded-full bg-menu-sheet-bg text-white shadow-lg"
        aria-label="Jump to a section"
      >
        <List size={16} aria-hidden />
        <span className="text-[7px] font-bold tracking-wide">MENU</span>
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        onExited={() => {
          if (!pendingAnchorRef.current) return;
          onSelect(pendingAnchorRef.current);
          pendingAnchorRef.current = null;
        }}
        ariaLabel="Jump to a section"
        maxHeight="70vh"
      >
        <div className="rounded-t-3xl bg-menu-sheet-bg p-4 text-white md:rounded-3xl">
          <h2 className="mb-3 font-display text-sm font-bold">Jump to a section</h2>
          <div className="flex flex-col">
            {sections.map((s) => (
              <button
                key={s.anchorId}
                type="button"
                onClick={() => {
                  pendingAnchorRef.current = s.anchorId;
                  setOpen(false);
                }}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  s.anchorId === activeAnchorId ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/5"
                }`}
              >
                <span>{s.label}</span>
                <span className="text-xs text-white/50">{s.count}</span>
              </button>
            ))}
          </div>
        </div>
      </Sheet>
    </>
  );
}
