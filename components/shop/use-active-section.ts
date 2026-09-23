"use client";

import { useEffect, useState } from "react";

/**
 * Tracks which of several section anchor ids is currently "active" (most
 * visible, below the sticky header/filter-chip band) via one shared
 * IntersectionObserver — drives the shop PLP's sticky section title and the
 * MENU sheet's highlighted row, and nothing else. A "jump to section" tap
 * is a plain `scrollIntoView`, with no observer involved.
 *
 * Known limitation, accepted by design (Swiggy has it too): a section's
 * scroll-jump target can shift by a few px when a section above it
 * collapses/expands — not worth scroll-compensation logic for.
 */
export function useActiveSection(sectionIds: string[], rootMargin = "-15% 0px -70% 0px"): string | null {
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null);
  const key = sectionIds.join("|");

  useEffect(() => {
    if (sectionIds.length === 0) return;
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const visibleRatios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleRatios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let bestId: string | null = null;
        let bestRatio = 0;
        for (const id of sectionIds) {
          const ratio = visibleRatios.get(id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestId) setActiveId(bestId);
      },
      { rootMargin, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, rootMargin]);

  return activeId;
}
