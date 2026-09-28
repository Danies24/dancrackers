"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function ShopPhotoGallery({ images: initialImages, shopName }: { images: string[], shopName: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Fallback for localhost testing until admin UI is built
  const images = initialImages && initialImages.length > 0 ? initialImages : [
    "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&q=80",
    "https://images.unsplash.com/photo-1533282960533-51328aa26626?w=800&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    "https://images.unsplash.com/photo-1606774643534-1925b6a3bd52?w=800&q=80"
  ];

  if (images.length === 0) return null;

  return (
    <>
      <div className="mt-4 px-4 pb-2">
        <h3 className="mb-2 text-sm font-semibold text-ink">Photos</h3>
        <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2">
          {images.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setLightboxIndex(idx)}
              className="relative h-24 w-36 shrink-0 snap-center overflow-hidden rounded-xl border border-border bg-ink-[0.02]"
            >
              <Image
                src={url}
                alt={`${shopName} photo ${idx + 1}`}
                fill
                className="object-cover transition-transform hover:scale-105"
                sizes="144px"
              />
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm animate-fade-in">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 text-white">
            <div className="text-sm font-medium">
              {lightboxIndex + 1} / {images.length}
            </div>
            <button
              onClick={() => setLightboxIndex(null)}
              className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Image Area */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            <Image
              src={images[lightboxIndex]}
              alt={`${shopName} photo ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : images.length - 1));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur-md transition-colors hover:bg-black/70"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev! < images.length - 1 ? prev! + 1 : 0));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur-md transition-colors hover:bg-black/70"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
          
          {/* Thumbnail Strip in Lightbox */}
          {images.length > 1 && (
            <div className="h-24 bg-black/50 p-4">
              <div className="flex h-full gap-2 overflow-x-auto">
                {images.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className={`relative h-full w-20 shrink-0 overflow-hidden rounded-md border-2 transition-opacity ${
                      idx === lightboxIndex ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
