"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/components/cart/cart-provider";
import { useValidatedCart } from "@/components/cart/use-validated-cart";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { formatRupees } from "@/lib/format";
import { getReferral } from "@/lib/referral";
import { buildCustomerMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  addressSchema,
  citySchema,
  emailSchema,
  nameSchema,
  phoneSchema,
  pincodeSchema,
} from "@/lib/validation";
import { getPhoneE164 } from "@/config/brandConfig";
import { trackEvent } from "@/lib/analytics";

const SESSION_KEY = "dc_enquiry_draft";

const formSchema = z
  .object({
    name: nameSchema,
    phone: phoneSchema,
    whatsappSame: z.boolean(),
    whatsapp: z.string().optional(),
    address: addressSchema,
    apartment: z.string().max(100).optional(),
    city: citySchema,
    pincode: pincodeSchema,
    landmark: z.string().max(100).optional(),
    email: emailSchema,
    preferredCallTime: z.enum(["anytime", "morning", "afternoon", "evening"]).optional(),
    notes: z.string().max(500).optional(),
    hp_check: z.string().optional(), // honeypot — see lib/validation.ts for why it's not named something autofill-prone
  })
  .superRefine((data, ctx) => {
    if (!data.whatsappSame) {
      const result = phoneSchema.safeParse(data.whatsapp ?? "");
      if (!result.success) {
        ctx.addIssue({ code: "custom", path: ["whatsapp"], message: "Enter a 10-digit mobile number" });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

export default function EnquiryPage() {
  const router = useRouter();
  const { items, clear } = useCart();
  const { loading, activeLines, totals, belowMinimum } = useValidatedCart();
  const [hydrated, setHydrated] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const renderedAt = useRef(Date.now());
  const submittedRef = useRef(false);

  useEffect(() => {
    setHydrated(true);
    trackEvent("enquiry_form_view");
  }, []);

  const draft = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as Partial<FormValues>) : null;
    } catch {
      return null;
    }
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      name: draft?.name ?? "",
      phone: draft?.phone ?? "",
      whatsappSame: draft?.whatsappSame ?? true,
      whatsapp: draft?.whatsapp ?? "",
      address: draft?.address ?? "",
      apartment: draft?.apartment ?? "",
      city: draft?.city ?? "Chennai",
      pincode: draft?.pincode ?? "",
      landmark: draft?.landmark ?? "",
      email: draft?.email ?? "",
      preferredCallTime: draft?.preferredCallTime ?? "anytime",
      notes: draft?.notes ?? "",
    },
  });

  const values = watch();
  useEffect(() => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(values));
    } catch {
      // sessionStorage unavailable — form still works, just won't survive back-navigation.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  useEffect(() => {
    if (hydrated && items.length === 0 && !submittedRef.current) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, router]);

  if (!hydrated || (items.length === 0 && !submittedRef.current)) return null;

  const whatsappSame = watch("whatsappSame");

  function buildFallbackWhatsAppUrl(formValues: FormValues): string {
    const message = buildCustomerMessage({
      orderRef: "(not yet saved)",
      name: formValues.name,
      phone: formValues.phone,
      items: activeLines.map((l) => ({
        nameEn: l.validated?.name_en ?? "Item",
        quantity: l.qty,
        unit: l.validated?.unit ?? "pcs",
        lineTotal: (l.validated?.price ?? 0) * l.qty,
      })),
      grandTotal: totals.grandTotal,
      address: formValues.address,
    });
    return buildWhatsAppUrl(getPhoneE164().replace(/^91/, ""), message);
  }

  async function onSubmit(formValues: FormValues) {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: formValues.name,
            phone: formValues.phone,
            whatsapp: formValues.whatsappSame ? undefined : formValues.whatsapp,
            email: formValues.email || undefined,
            address: formValues.address,
            apartment: formValues.apartment || undefined,
            city: formValues.city,
            pincode: formValues.pincode,
            landmark: formValues.landmark || undefined,
            preferredCallTime: formValues.preferredCallTime,
            notes: formValues.notes || undefined,
          },
          items: activeLines.map((l) => ({ productId: l.productId, quantity: l.qty })),
          captainCode: getReferral() ?? undefined,
          hp_check: formValues.hp_check || undefined,
          meta: { sourceUrl: window.location.href, formRenderedAt: renderedAt.current },
        }),
      });

      const data = await res.json();

      if (res.ok || res.status === 409) {
        try {
          window.sessionStorage.removeItem(SESSION_KEY);
          window.sessionStorage.setItem(
            "dc_last_order",
            JSON.stringify({
              orderRef: data.orderRef,
              whatsappUrl: data.whatsappUrl,
              grandTotal: data.totals?.grandTotal,
              totalQuantity: data.totals?.totalQuantity,
              phone: formValues.phone,
            }),
          );
        } catch {}
        submittedRef.current = true;
        trackEvent("enquiry_submitted", {
          order_ref: data.orderRef,
          value: data.totals?.grandTotal,
          item_count: data.totals?.totalQuantity,
          captain_code: getReferral() ?? undefined,
          city: formValues.city,
        });
        clear();
        router.push(`/enquiry/success?ref=${encodeURIComponent(data.orderRef)}`);
        return;
      }

      trackEvent("enquiry_failed", { reason: data?.error?.code ?? "unknown" });
      setSubmitError(data?.error?.message ?? "We could not save your enquiry. Please send it to us on WhatsApp instead.");
    } catch {
      trackEvent("enquiry_failed", { reason: "network_error" });
      setSubmitError("We could not save your enquiry. Please send it to us on WhatsApp instead.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Your Details</h1>

      {!loading && (
        <div className="mt-3 rounded-md border border-border bg-surface p-3 text-sm text-ink-soft">
          {items.reduce((s, i) => s + i.qty, 0)} items · <strong>{formatRupees(totals.grandTotal)}</strong>{" "}
          <Link href="/cart" className="font-semibold text-maroon-ink">
            view
          </Link>
        </div>
      )}

      {belowMinimum && !loading && (
        <p className="mt-3 text-sm text-amber">
          Your cart is below the minimum order value.{" "}
          <Link href="/cart" className="font-semibold underline">
            Go back to cart
          </Link>
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        {/* Honeypot — hidden from real users, any value silently drops the submission (§30.2) */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px]"
          {...register("hp_check")}
        />

        <Input label="Full name" required autoComplete="name" error={errors.name?.message} {...register("name")} />

        <Input
          label="Mobile number"
          required
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" {...register("whatsappSame")} className="h-5 w-5" />
          WhatsApp number is the same as above
        </label>

        {!whatsappSame && (
          <Input
            label="WhatsApp number"
            required
            type="tel"
            inputMode="numeric"
            error={errors.whatsapp?.message}
            {...register("whatsapp")}
          />
        )}

        <Textarea
          label="Delivery address"
          required
          autoComplete="street-address"
          error={errors.address?.message}
          rows={3}
          {...register("address")}
        />

        <Input label="Apartment / building" autoComplete="address-line2" {...register("apartment")} />

        <Input label="City" required autoComplete="address-level2" error={errors.city?.message} {...register("city")} />

        <Input
          label="Pincode"
          required
          type="tel"
          inputMode="numeric"
          autoComplete="postal-code"
          error={errors.pincode?.message}
          {...register("pincode")}
        />

        <Input label="Landmark" {...register("landmark")} />

        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="preferredCallTime" className="text-sm font-medium text-ink-soft">
            Preferred call time
          </label>
          <select
            id="preferredCallTime"
            {...register("preferredCallTime")}
            className="h-12 rounded-md border border-border bg-surface px-3 text-[16px]"
          >
            <option value="anytime">Anytime</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </div>

        <Textarea label="Notes" rows={3} {...register("notes")} />

        {submitError && (
          <div className="rounded-md border border-red/30 bg-red/5 p-3 text-sm text-red">
            <p>{submitError}</p>
            <a
              href={buildFallbackWhatsAppUrl(watch())}
              target="_blank"
              rel="noopener"
              className="mt-2 inline-block rounded-md bg-whatsapp px-4 py-2 font-semibold text-white"
            >
              Send this order on WhatsApp
            </a>
          </div>
        )}

        <Button type="submit" size="full" disabled={submitting || belowMinimum}>
          {submitting ? "Submitting…" : "Submit Enquiry"}
        </Button>
      </form>
    </div>
  );
}
