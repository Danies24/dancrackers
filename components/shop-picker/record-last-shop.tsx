"use client";

import { useEffect } from "react";
import { writeLastShop } from "@/lib/last-shop";

/** Remembers the shop being browsed for the picker's "Continue" bar. Not rendered for preview visits. */
export function RecordLastShop({ slug, name }: { slug: string; name: string }) {
  useEffect(() => {
    writeLastShop(slug, name);
  }, [slug, name]);
  return null;
}
