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
 * plan) — built on the shared Sheet primitive. The inner wrapper repeats
 * the panel's own rounded-t-3xl/md:rounded-3xl radius (plus overflow-hidden)
 * rather than relying on Sheet's panel to clip it — Sheet uses
 * overflow-y-auto, not overflow-hidden, so a full-bleed child background
 * would otherwise show square corners under the rounded top edge.
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
        <div className="overflow-hidden rounded-t-3xl bg-menu-sheet-bg p-4 text-white md:rounded-3xl">
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
