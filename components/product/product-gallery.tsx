"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { ImageWithSkeleton } from "@/components/product/image-with-skeleton";

interface Props {
  images: string[];
  name: string;
  category: string;
}

/**
 * §12.4 section 2. Swipeable via scroll-snap, dot indicators, letter placeholder on miss.
 * Interactive fullscreen preview modal with uncropped image display and cross (close) button.
 */
export function ProductGallery({ images, name, category }: Props) {
  const [active, setActive] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll and handle keyboard shortcuts when preview modal is open
  useEffect(() => {
    if (!previewOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPreviewOpen(false);
      } else if (e.key === "ArrowLeft" && images.length > 1) {
        setActive((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === "ArrowRight" && images.length > 1) {
        setActive((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [previewOpen, images.length]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-maroon-tint">
        <span className="font-display text-6xl font-semibold text-maroon-ink">
          {name.trim().charAt(0).toUpperCase() || "?"}
        </span>
      </div>
    );
  }

  function scrollTo(i: number) {
    setActive(i);
    scrollerRef.current?.scrollTo({ left: i * (scrollerRef.current?.clientWidth ?? 0), behavior: "smooth" });
  }

  function openPreview(index: number) {
    setActive(index);
    setPreviewOpen(true);
  }

  return (
    <div>
      <div className="group relative">
        <div
          ref={scrollerRef}
          className="flex aspect-square w-full snap-x snap-mandatory overflow-x-auto rounded-2xl border border-border shadow-soft"
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.clientWidth > 0) {
              const i = Math.round(el.scrollLeft / el.clientWidth);
              if (i !== active) setActive(i);
            }
          }}
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => openPreview(i)}
              aria-label={`View full image ${i + 1} of ${images.length} for ${name}`}
              className="relative aspect-square w-full shrink-0 snap-center bg-white cursor-zoom-in text-left focus:outline-none focus:ring-2 focus:ring-maroon"
            >
              <ImageWithSkeleton
                src={src}
                alt={`${name} — ${category}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-3 sm:p-4 transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                priority={i === 0}
              />
            </button>
          ))}
        </div>

        {/* Floating "View Full" Pill Button for touch/mouse */}
        <button
          type="button"
          onClick={() => openPreview(active)}
          className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md transition-all hover:bg-black/90 active:scale-95"
          aria-label="Open full image preview"
        >
          <ZoomIn size={14} aria-hidden />
          <span>View Full</span>
        </button>
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === active ? "w-6 bg-maroon" : "w-2.5 bg-border hover:bg-maroon-soft"
              }`}
            />
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox / Modal */}
      {previewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} full image preview`}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 p-3 sm:p-6 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewOpen(false)}
        >
          {/* Top Bar: Title, Category & Cross Close Button */}
          <div
            className="flex w-full max-w-5xl items-center justify-between gap-3 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-display text-sm sm:text-base font-bold text-white">
                {name}
              </h3>
              {category && <p className="truncate text-xs text-white/70">{category}</p>}
            </div>

            {/* Prominent Cross Button */}
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              aria-label="Close image preview"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white shadow-lg transition-all hover:bg-white/30 active:scale-90"
            >
              <X size={24} aria-hidden strokeWidth={2.5} />
            </button>
          </div>

          {/* Main Uncropped Image Display */}
          <div
            className="relative flex flex-1 w-full max-w-4xl items-center justify-center py-2"
            onClick={(e) => e.stopPropagation()}
          >
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setActive((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                aria-label="Previous image"
                className="absolute left-1 sm:left-4 z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/90 active:scale-95"
              >
                <ChevronLeft size={24} aria-hidden />
              </button>
            )}

            <div className="relative h-[68vh] sm:h-[76vh] w-full max-w-3xl bg-white rounded-lg">
              <ImageWithSkeleton
                src={images[active] ?? images[0]}
                alt={`${name} — ${category}`}
                fill
                sizes="100vw"
                className="object-contain p-2 sm:p-4"
                priority
              />
            </div>

            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setActive((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                aria-label="Next image"
                className="absolute right-1 sm:right-4 z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/90 active:scale-95"
              >
                <ChevronRight size={24} aria-hidden />
              </button>
            )}
          </div>

          {/* Bottom Bar: Multi-image dots & Helper hint */}
          <div
            className="flex flex-col items-center gap-1 text-center text-white/80"
            onClick={(e) => e.stopPropagation()}
          >
            {images.length > 1 && (
              <>
                <p className="text-xs font-semibold tabular-nums text-white/90">
                  {active + 1} / {images.length}
                </p>
                <div className="flex gap-1.5 py-0.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`View image ${i + 1}`}
                      onClick={() => setActive(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === active ? "w-6 bg-gold" : "w-2 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            <p className="text-[11px] text-white/60">Tap cross or anywhere outside to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
