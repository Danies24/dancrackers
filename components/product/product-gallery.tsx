"use client";

import Image from "next/image";
import { useRef, useState } from "react";

interface Props {
  images: string[];
  name: string;
  category: string;
}

/** §12.4 section 2. Swipeable via scroll-snap, dot indicators, letter placeholder on miss. */
export function ProductGallery({ images, name, category }: Props) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-maroon-tint">
        <span className="font-display text-6xl font-semibold text-maroon-ink">
          {name.trim().charAt(0).toUpperCase() || "?"}
        </span>
      </div>
    );
  }

  function scrollTo(i: number) {
    setActive(i);
    scrollerRef.current?.scrollTo({ left: i * scrollerRef.current.clientWidth, behavior: "smooth" });
  }

  return (
    <div>
      <div
        ref={scrollerRef}
        className="flex aspect-square w-full snap-x snap-mandatory overflow-x-auto rounded-lg"
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (i !== active) setActive(i);
        }}
      >
        {images.map((src, i) => (
          <div key={src} className="relative aspect-square w-full shrink-0 snap-center bg-cream">
            <Image
              src={src}
              alt={`${name} — ${category}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={`h-2 w-2 rounded-full ${i === active ? "bg-maroon" : "bg-border"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
