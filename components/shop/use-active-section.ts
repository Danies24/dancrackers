"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks which of several section anchor ids is currently "active" (most
 * visible, below the sticky header/filter-chip band) via one shared
 * IntersectionObserver — drives the shop PLP's sticky section title and the
 * MENU sheet's highlighted row, and nothing else. A "jump to section" tap
 * is a plain `scrollIntoView`, with no observer involved in the tap itself.
 *
 * Two problems on a long page (a shop with many categories — Gurusamy's
 * ~26 vs Sri Ram's ~16): a `behavior: "smooth"` jump can take a second or
 * more to settle, and the observer keeps firing on whatever briefly passes
 * through the band mid-flight, leaving a stale ratio for a section the
 * viewport blew straight past (clicking a category far down correctly
 * scrolled there, but the ring stayed stuck on the first section). And
 * even once fully settled, the ~15%-tall observation band can end up
 * geometrically favoring the section just *above* the clicked one by a
 * few pixels (its tail overlaps more of the narrow band than the clicked
 * section's head does) — a fixed timeout can't reliably wait that out
 * since it doesn't know the settle point in advance.
 *
 * `jumpTo` sets the id immediately (instant feedback, matches what was
 * actually clicked) and suppresses the observer until the reader makes a
 * genuine scroll gesture of their own (wheel/touch/arrow-key) — not the
 * generic `scroll` event, which the programmatic smooth-scroll animation
 * itself fires and would otherwise release the suppression mid-flight.
 * Until then the clicked section stays the answer, which is what someone
 * who just tapped it actually wants, geometry aside.
 *
 * Known limitation, accepted by design (Swiggy has it too): a section's
 * scroll-jump target can shift by a few px when a section above it
 * collapses/expands — not worth scroll-compensation logic for.
 */
export function useActiveSection(
  sectionIds: string[],
  rootMargin = "-15% 0px -70% 0px",
): [string | null, (id: string) => void] {
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null);
  const suppressedRef = useRef(false);
  const key = sectionIds.join("|");

  useEffect(() => {
    function release() {
      suppressedRef.current = false;
    }
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchstart", release, { passive: true });
    window.addEventListener("keydown", release);
    return () => {
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchstart", release);
      window.removeEventListener("keydown", release);
    };
  }, []);

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
        if (suppressedRef.current) return;
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

  function jumpTo(id: string) {
    setActiveId(id);
    suppressedRef.current = true;
  }

  return [activeId, jumpTo];
}
