"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export interface HeroBannerSlide {
  id: string;
  /** Local path under public/, or a remote URL already allow-listed in next.config.ts's images.remotePatterns. Omit for a gradient placeholder (no photo shot yet). */
  imageUrl?: string;
  eyebrow?: string;
  headline?: string;
  headlineTa?: string;
}

const AUTO_ADVANCE_MS = 4500;

/**
 * The home hero's auto-looping banner carousel — swipeable, dot indicators,
 * pauses on hover/touch so a reader mid-swipe or mid-read isn't fought by
 * the timer. Collapses to a static first slide under prefers-reduced-motion
 * (global rule in globals.css zeroes animation/transition durations, so the
 * CSS-driven dot/scroll transitions go instant; the JS interval below is
 * separately gated on the same media query since it isn't a CSS animation).
 */
export function HeroBannerCarousel({ slides }: { slides: HeroBannerSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Guards the onScroll listener below against the *programmatic*
  // scrollIntoView triggered by `active` changing — without this, the
  // intermediate scrollLeft values fired mid-animation round to the
  // slide being left, immediately calling setActive back to it and
  // yanking the scroll home before it ever reaches the target. That
  // silently broke both auto-advance and the dot buttons (the carousel
  // never actually left slide 1) until caught in browser testing.
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((i) => (i + 1) % slides.length), AUTO_ADVANCE_MS);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const card = scroller?.children[active] as HTMLElement | undefined;
    if (!scroller || !card) return;
    isSyncingRef.current = true;
    // scroller.scrollTo (not card.scrollIntoView) — scrollIntoView's
    // block/inline options still let the browser walk up and scroll any
    // scrollable ancestor, including the page itself, to bring the card
    // fully into view. On a page where the carousel isn't the section
    // currently in view, that yanked the whole page back down to it on
    // every auto-advance tick. scrollTo targets this element's own
    // scrollLeft directly, so only the horizontal strip ever moves.
    scroller.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
    const t = setTimeout(() => {
      isSyncingRef.current = false;
    }, 600);
    return () => clearTimeout(t);
  }, [active]);

  if (slides.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onTouchCancel={() => setPaused(false)}
    >
      <div
        ref={scrollerRef}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto rounded-[28px] shadow-soft-lg"
        onScroll={(e) => {
          if (isSyncingRef.current) return;
          const el = e.currentTarget;
          if (el.clientWidth > 0) {
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== active) setActive(i);
          }
        }}
      >
        {slides.map((slide, i) => (
          <div key={slide.id} className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden sm:aspect-[21/9]">
            {slide.imageUrl ? (
              <Image
                src={slide.imageUrl}
                alt=""
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-festival" />
            )}
            {(slide.eyebrow || slide.headline) && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-left">
                  {slide.eyebrow && (
                    <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur">
                      {slide.eyebrow}
                    </span>
                  )}
                  {slide.headline && (
                    <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-white md:text-4xl">
                      {slide.headline}
                    </h2>
                  )}
                  {slide.headlineTa && (
                    <p lang="ta" className="mt-1.5 max-w-lg text-sm text-white/85 md:text-base">
                      {slide.headlineTa}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show slide ${i + 1} of ${slides.length}`}
              aria-current={i === active}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-maroon" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
