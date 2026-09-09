import { Fraunces, Inter, Noto_Sans_Tamil } from "next/font/google";

/** Two families max (§25.3). Tamil is a separate subset so Latin-only pages never download it. */
export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600"],
  display: "swap",
});

export const inter = Inter({
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
