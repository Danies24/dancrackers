import type { Metadata } from "next";
import Image from "next/image";
import { Noto_Sans_Tamil } from "next/font/google";
import { brandConfig, getPhoneDisplay, getPhoneE164 } from "@/config/brandConfig";

const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], weight: ["600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: { absolute: `${brandConfig.brand.name} — Reopening Diwali 2027` },
  description: "The season is over. Our site reopens for Diwali 2027.",
  robots: { index: false, follow: false },
};

const collage = [
  "/images/hero/kolagalam-brand.webp",
  "/images/hero/sivakasi-shops-market.webp",
  "/images/hero/straight-from-sivakasi-sparkler.webp",
];

export default function ClosedPage() {
  const phoneHref = `tel:+${getPhoneE164()}`;

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background:
          "linear-gradient(135deg, #ff4e50 0%, #f9d423 30%, #ff0080 62%, #7928ca 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 grid grid-cols-3 opacity-30" aria-hidden>
        {collage.map((src) => (
          <div key={src} className="relative">
            <Image src={src} alt="" fill sizes="33vw" className="object-cover" priority />
          </div>
        ))}
      </div>

      <main className="relative z-10 w-full max-w-lg rounded-3xl bg-white px-6 py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:px-10">
        <p className="text-4xl" aria-hidden>
          🎆 🪔 🎇
        </p>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#d6006e] sm:text-4xl">
          Season is over
        </h1>
        <p className="mt-2 text-xl font-bold text-[#7928ca] sm:text-2xl">
          The site will reopen for Diwali 2027
        </p>
        <p className="mt-1 text-sm font-semibold text-[#ff6a00]">
          The site is under construction. See you next Diwali!
        </p>

        <hr className="mx-auto my-7 h-1 w-24 rounded-full border-0 bg-gradient-to-r from-[#ff4e50] via-[#f9d423] to-[#7928ca]" />

        <p className="text-sm font-semibold text-neutral-700 sm:text-base">
          For any other fire crackers delivery, please contact
        </p>

        <div className="mt-5 rounded-2xl border-2 border-[#f9d423] bg-[#fff8e1] px-4 py-5">
          <p className={`${tamil.className} text-3xl font-extrabold text-[#d6006e]`}>கோலாகலம்</p>
          <p className="text-2xl font-extrabold tracking-wide text-[#7928ca]">KOLAGALAM</p>
          <p className={`${tamil.className} mt-3 text-xl font-bold text-[#0a8f5a]`}>டேனிஷ் முகமது</p>
          <p className="text-lg font-bold text-neutral-800">Danish Mohamed</p>
          <a
            href={phoneHref}
            className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#ff4e50] to-[#ff0080] px-7 py-3 text-xl font-extrabold text-white shadow-lg"
          >
            📞 +91 {getPhoneDisplay()}
          </a>
        </div>
      </main>
    </div>
  );
}
