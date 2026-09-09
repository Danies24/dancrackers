"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function ProductViewTracker(props: {
  productId: string;
  sku: string;
  name: string;
  category?: string;
  price: number | null;
}) {
  useEffect(() => {
    trackEvent("product_view", {
      product_id: props.productId,
      sku: props.sku,
      name: props.name,
      category: props.category,
      price: props.price,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.productId]);

  return null;
}
