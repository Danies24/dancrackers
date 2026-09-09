import { Space_Grotesk, Manrope, Noto_Sans_Tamil } from "next/font/google";

/** Dark Diwali 2026 design system: Space Grotesk for display, Manrope for body. */
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const notoSansTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  variable: "--font-tamil",
  weight: ["400", "500"],
  display: "swap",
});
