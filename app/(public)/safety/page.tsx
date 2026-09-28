import type { Metadata } from "next";
import Link from "next/link";

import { getCanonicalUrl } from "@/config/brandConfig";

export const metadata: Metadata = {
  title: "Firecracker Safety Guide",
  description: "Essential firecracker safety instructions. Safe handling tips for a joyful and secure Diwali celebration.",
  alternates: {
    canonical: getCanonicalUrl("/safety"),
  },
  openGraph: {
    title: "Firecracker Safety Guide",
    description: "Essential firecracker safety instructions. Safe handling tips for a joyful and secure Diwali celebration.",
    url: getCanonicalUrl("/safety"),
  },
};

// [BLOCKED — PRD §12.9, §42.1 item 9] This is a SAMPLE safety text, sourced
// from the representative sample catalogue (Selva Fancy Crackers 2026), not
// yet confirmed by the real supplier. Per the PRD's hard rule
// (§14.3/§12.9): "do not paraphrase or invent safety guidance" — this MUST
// be replaced with the real supplier's own text before launch. Item 8 was
// not legible in the source scan and is left blank rather than guessed.
const instructions: Array<{ en: string }> = [
  { en: "Do not use small matchsticks or small incense sticks to light fireworks." },
  { en: "Do not burst crackers under trees or electrical wires." },
  { en: "Do not join two or three crackers together and light them at once." },
  { en: "Do not keep a lit lamp or incense stick near stored crackers." },
  { en: "Do not go near a cracker that failed to burst, or try to relight it." },
  { en: "Do not throw lit crackers on streets or roads while people or vehicles are passing." },
  { en: "Never throw or aim a firework at another person." },
  { en: "Do not burst crackers inside the house." },
  { en: "If a lit cracker does not go off, do not pick it up or kick it." },
  { en: "Wear cotton clothing while bursting crackers." },
  { en: "Burst crackers safely and celebrate a happy Deepavali." },
];

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Safety Instructions</h1>

      <ol className="mt-6 flex flex-col gap-3">
        {instructions.map((item, i) => (
          <li key={i} className="rounded-lg border border-border bg-surface p-3">
            <span className="text-xs font-semibold text-muted">{i + 1}.</span>
            <p className="mt-1 text-ink">{item.en}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm text-ink-soft">
        <p>
          Fireworks are explosives. Always burst them outdoors, in an open space, under adult supervision, and
          keep water or sand nearby.
        </p>
        <p className="mt-2">
          Permitted bursting hours and locations are set by local authorities and vary by city and year — it is
          your responsibility to observe them.
        </p>
        <p className="mt-2">
          See our{" "}
          <Link href="/compliance" className="font-semibold text-maroon-ink">
            compliance page
          </Link>{" "}
          for the legal framework behind this.
        </p>
      </div>
    </div>
  );
}
