"use client";

import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { CategoryRow } from "@/lib/data";

interface Props {
  categories: CategoryRow[];
}

/**
 * The homepage "quick enquiry" lead form. Intentionally lightweight and
 * separate from the real cart-bound /enquiry flow (see
 * supabase/migrations/20260909000006_general_enquiries.sql) — this just
 * requests a callback, it never claims a price or an order reference.
 */
export function GeneralEnquiryForm({ categories }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderedAt = useRef(Date.now());

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/general-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: email || undefined,
          category: category || undefined,
          message: message || undefined,
          company: company || undefined,
          formRenderedAt: renderedAt.current,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? "We couldn't save your enquiry. Please call or WhatsApp us instead.");
        return;
      }
      setDone(true);
      playChime();
    } catch {
      setError("We couldn't save your enquiry. Please call or WhatsApp us instead.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-teal/30 bg-teal-tint px-6 py-14 text-center">
        <Sparkles className="text-teal-ink" size={32} aria-hidden />
        <p className="font-display text-xl font-semibold text-ink">Enquiry sent successfully! 🎆</p>
        <p className="text-sm text-ink-soft">We&apos;ll call you back shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <input
        type="text"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px]"
      />
      <Input label="Your Name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      <Input
        label="Phone Number"
        required
        type="tel"
        inputMode="numeric"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
      />
      <Input
        label="Email (Optional)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="general-enquiry-category" className="text-sm font-medium text-ink-soft">
          Product Category
        </label>
        <select
          id="general-enquiry-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-12 rounded-2xl border border-border bg-surface px-3.5 text-[16px] text-ink"
        >
          <option value="">Select Product Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name_en}>
              {c.name_en}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Textarea label="Your Message (Optional)" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-ink sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" size="full" disabled={submitting}>
          {submitting ? "Sending…" : "Send Enquiry ✨"}
        </Button>
      </div>
    </form>
  );
}

/** A very short synthesised chime — never a licensed sample, never autoplayed. */
function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = [660, 880, 1320];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
    setTimeout(() => ctx.close(), 700);
  } catch {
    // Web Audio unavailable/blocked — silent, never breaks the success state.
  }
}
