"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { captureReferral, getReferral, normalizeCode } from "@/lib/referral";
import { trackEvent } from "@/lib/analytics";

/**
 * Manual fallback for captain attribution (PRD §20.4/§20.6) — for when the
 * automatic /c/[code] capture didn't survive (cleared storage, different
 * device, code shared verbally). Format-checks only; never verifies the code
 * exists, matching /c/[code]'s own "never shows an error, whatever the code"
 * philosophy so a customer can never probe whether a code is real.
 */
export function ReferralCodeField() {
  const [applied, setApplied] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const ref = getReferral();
    setApplied(ref);
  }, []);

  function onApply() {
    const code = normalizeCode(value);
    if (!code) {
      setError("Enter a valid code like RAJ12");
      return;
    }
    captureReferral(code);
    setApplied(code);
    setEditing(false);
    setError(undefined);
    trackEvent("captain_code_applied_manually", { captain_code: code });
  }

  if (applied && !editing) {
    return (
      <p className="mt-4 text-sm text-ink-soft">
        Referred by <span className="font-semibold text-maroon-ink">{applied}</span>{" "}
        <button
          type="button"
          onClick={() => {
            setValue(applied);
            setEditing(true);
          }}
          className="font-semibold underline"
        >
          change
        </button>
      </p>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-4 text-sm font-semibold text-maroon-ink underline"
      >
        Have a captain&apos;s code?
      </button>
    );
  }

  return (
    <div className="mt-4 flex items-end gap-2">
      <div className="flex-1">
        <Input
          label="Captain's code"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            setError(undefined);
          }}
          error={error}
          placeholder="e.g. RAJ12"
        />
      </div>
      <button
        type="button"
        onClick={onApply}
        className="mb-1.5 h-12 rounded-2xl bg-maroon px-4 text-sm font-semibold text-white"
      >
        Apply
      </button>
    </div>
  );
}
