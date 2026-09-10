"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import { trackEvent } from "@/lib/analytics";

interface LastOrder {
  orderRef: string;
  whatsappUrl: string | null;
  grandTotal?: number;
  totalQuantity?: number;
  phone?: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? "";
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("dc_last_order");
      if (raw) {
        const parsed = JSON.parse(raw) as LastOrder;
        if (parsed.orderRef === ref) setOrder(parsed);
      }
    } catch {
      // No stored detail (e.g. a hard refresh in a new context) — the page still
      // works from the reference alone, per §12.7 "still renders from the reference in the URL".
    }
    trackEvent("enquiry_success_view", { order_ref: ref });
  }, [ref]);

  function copyRef() {
    navigator.clipboard?.writeText(ref).then(() => {
      setCopied(true);
      trackEvent("order_ref_copied", { order_ref: ref });
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-tint text-teal">
        <Check size={32} />
      </div>
      <h1 className="font-display text-2xl font-semibold text-ink">Enquiry received</h1>

      <button
        type="button"
        onClick={copyRef}
        className="mx-auto mt-4 flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 font-mono text-sm"
      >
        {ref} <Copy size={14} aria-hidden />
        {copied && <span className="text-teal-ink">Copied</span>}
      </button>

      <p className="mt-4 text-ink-soft">
        We have your order. <strong>Dan or Arun will call you on {siteConfig.operator.phoneDisplay} within 2 hours.</strong>
      </p>

      {order?.grandTotal !== undefined && (
        <p className="mt-3 text-sm text-ink-soft">
          {order.totalQuantity} items · <strong>{formatRupees(order.grandTotal)}</strong>
        </p>
      )}

      <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-left">
        <h2 className="mb-2 text-sm font-semibold text-ink">What happens next</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-soft">
          <li>We call to confirm your items and address</li>
          <li>You pay the supplier directly by UPI or bank transfer</li>
          <li>The supplier despatches your order</li>
          <li>You receive your crackers</li>
        </ol>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {order?.whatsappUrl && (
          <a href={order.whatsappUrl} target="_blank" rel="noopener" onClick={() => trackEvent("whatsapp_click", { context: "success" })}>
            <Button variant="whatsapp" size="full">
              Send this order on WhatsApp
            </Button>
          </a>
        )}
        <a href={`tel:+${siteConfig.operator.phoneE164}`} onClick={() => trackEvent("call_click", { context: "success" })}>
          <Button variant="secondary" size="full">
            Call us now
          </Button>
        </a>
      </div>

      <p className="mt-6 text-xs text-muted">
        Fireworks are explosives — please follow our{" "}
        <Link href="/safety" className="font-semibold text-maroon-ink">
          safety guidance
        </Link>
        .
      </p>

      <Link href="/products" className="mt-6 inline-block text-sm font-semibold text-maroon-ink">
        Browse more crackers →
      </Link>
    </div>
  );
}

export default function EnquirySuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
