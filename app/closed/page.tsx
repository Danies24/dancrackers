import type { Metadata } from "next";
import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { Noto_Sans_Tamil } from "next/font/google";
import { DiyaIcon } from "@/components/marketing/diya-icon";
import { brandConfig, getPhoneDisplay, getPhoneE164, getPrimaryEmail } from "@/config/brandConfig";

// The app fonts (Space Grotesk / Manrope) have no Tamil glyphs — used only for the Tamil brand name.
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], weight: ["700"], display: "swap" });

export const metadata: Metadata = {
  title: { absolute: `${brandConfig.brand.name} — Reopening Diwali 2027` },
  description: "The season is over. Our site reopens for Diwali 2027.",
};

const collage = [
  "/images/hero/kolagalam-brand.webp",
  "/images/hero/sivakasi-shops-market.webp",
  "/images/hero/straight-from-sivakasi-sparkler.webp",
];

export default function ClosedPage() {
  const email = getPrimaryEmail();

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{ background: "var(--gradient-festival)" }}
    >
      <div className="pointer-events-none absolute inset-0 grid grid-cols-3 opacity-25" aria-hidden>
        {collage.map((src) => (
          <div key={src} className="relative">
            <Image src={src} alt="" fill sizes="33vw" className="object-cover" priority />
          </div>
        ))}
      </div>

      <main className="relative z-10 w-full max-w-md rounded-lg border border-border bg-surface px-6 py-10 text-center shadow-2xl sm:px-8">
        <div className="flex items-center justify-center gap-2">
          <DiyaIcon size={28} />
          <span className="font-display text-xl font-bold text-ink">{brandConfig.brand.name}</span>
        </div>
        <p className={`${tamil.className} mt-1 text-lg text-maroon-ink`}>கோலாகலம்</p>

        <h1 className="mt-6 font-display text-3xl font-bold text-maroon-ink">Season is over</h1>
        <p className="mt-2 font-display text-lg font-semibold text-ink">
          The site will reopen for Diwali 2027
        </p>
        <p className="mt-1 text-sm text-ink-soft">The site is under construction. See you next Diwali!</p>

        <div className="mx-auto my-6 h-1 w-20 rounded-full" style={{ background: "var(--gradient-primary)" }} />

        <p className="text-sm font-semibold text-ink-soft">
          For any other fire crackers delivery, please contact
        </p>

        <ul className="mt-4 space-y-3 text-left">
          <li>
            <a
              href={`tel:+${getPhoneE164()}`}
              className="flex items-center gap-3 rounded-md border border-border bg-secondary-bg px-4 py-3 font-semibold text-ink"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-maroon-tint text-maroon-ink">
                <Phone size={18} aria-hidden />
              </span>
              +91 {getPhoneDisplay()}
            </a>
          </li>
          <li>
            <a
              href={`mailto:${email.address}`}
              className="flex items-center gap-3 break-all rounded-md border border-border bg-secondary-bg px-4 py-3 font-semibold text-ink"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pink-tint text-pink-ink">
                <Mail size={18} aria-hidden />
              </span>
              {email.address}
            </a>
          </li>
        </ul>
      </main>
    </div>
  );
}
