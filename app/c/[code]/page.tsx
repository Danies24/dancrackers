"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { captureReferral, normalizeCode } from "@/lib/referral";

/**
 * §12.12, §20.4. Not a visible page — captures the code, fires the click
 * event, and redirects. Never shows an error, whatever the code (§9.4 FR-4.6).
 */
export default function ReferralLandingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = use(params);
  const router = useRouter();

  useEffect(() => {
    const code = normalizeCode(rawCode) ?? rawCode.trim().toUpperCase();
    captureReferral(code);

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "click", code }),
      keepalive: true,
    }).catch(() => {});

    router.replace("/products?welcome=1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawCode]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
    </div>
  );
}
