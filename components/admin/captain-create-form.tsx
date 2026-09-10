"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { suggestCaptainCode } from "@/lib/captain-code";

export function CaptainCreateForm({ existingCodes }: { existingCodes: string[] }) {
  const router = useRouter();
  const { show } = useToast();
  const [saving, setSaving] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    code: "",
    commission_rate: "3",
    city: "",
    area: "",
    source: "",
    upi_id: "",
    notes: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onNameBlur() {
    if (!codeTouched && form.name.trim()) {
      set("code", suggestCaptainCode(form.name, existingCodes));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/captains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          code: form.code.toUpperCase(),
          commission_rate: form.commission_rate === "" ? undefined : Number(form.commission_rate),
          city: form.city || undefined,
          area: form.area || undefined,
          source: form.source || undefined,
          upi_id: form.upi_id || undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        show(data?.error?.message ?? "Could not create captain.");
        return;
      }
      show("Captain created.");
      router.push(`/admin/captains/${data.captain.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Name" required>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          onBlur={onNameBlur}
          required
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
      </Field>

      <Field label="Phone" required>
        <input
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          required
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
      </Field>

      <Field label="Code" required>
        <input
          value={form.code}
          onChange={(e) => {
            setCodeTouched(true);
            set("code", e.target.value.toUpperCase());
          }}
          placeholder="e.g. RAJ12"
          required
          pattern="[A-Z]{3}[0-9]{2}"
          className="h-10 w-full rounded-md border border-border bg-surface px-3 font-mono text-sm"
        />
        <p className="mt-1 text-xs text-muted">Suggested from the name — 3 letters + 2 digits, spoken aloud and typed into WhatsApp. Edit freely.</p>
      </Field>

      <Field label="Commission rate (%)" required>
        <input
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={form.commission_rate}
          onChange={(e) => set("commission_rate", e.target.value)}
          required
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
        <p className="mt-1 text-xs text-muted">What this captain earns on the grand total of each delivered order. You can change this anytime.</p>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="City">
          <input
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          />
        </Field>
        <Field label="Area">
          <input
            value={form.area}
            onChange={(e) => set("area", e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          />
        </Field>
      </div>

      <Field label="Source">
        <input
          value={form.source}
          onChange={(e) => set("source", e.target.value)}
          placeholder="How recruited"
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
      </Field>

      <Field label="UPI ID">
        <input
          value={form.upi_id}
          onChange={(e) => set("upi_id", e.target.value)}
          placeholder="For payout"
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
      </Field>

      <Field label="Notes">
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-surface p-2 text-sm"
        />
      </Field>

      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-md bg-maroon py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {saving ? "Creating…" : "Create Captain"}
      </button>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink-soft">
        {label}
        {required && " *"}
      </label>
      {children}
    </div>
  );
}
