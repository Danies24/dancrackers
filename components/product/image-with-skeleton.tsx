"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * next/image, but with a pulsing skeleton shown in its place until the
 * image actually finishes loading — for `fill` usage inside a `relative`
 * parent (product cards, the product gallery).
 */
export function ImageWithSkeleton({ className, alt, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0" />}
      <Image
        {...props}
        alt={alt}
        className={cn(className, "transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
      />
    </>
  );
}
