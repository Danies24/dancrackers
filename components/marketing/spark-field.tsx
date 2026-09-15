import { DiyaIcon } from "@/components/marketing/diya-icon";

/**
 * Minimal decorative "distant fireworks" — a handful of soft radial-gradient
 * blobs that slowly drift/twinkle, plus small crisp spark-pop accents and a
 * corner diya. Pure CSS, no canvas, no imagery of real people. Respects
 * prefers-reduced-motion via the global rule in globals.css (animation
 * durations are zeroed there).
 */
const SPARKS = [
  { top: "12%", left: "8%", size: 180, color: "var(--glow-orange)", delay: "0s", duration: "7s" },
  { top: "22%", left: "78%", size: 220, color: "var(--glow-pink)", delay: "1.2s", duration: "9s" },
  { top: "60%", left: "18%", size: 160, color: "var(--glow-gold)", delay: "2.4s", duration: "8s" },
  { top: "72%", left: "62%", size: 200, color: "var(--glow-orange)", delay: "0.6s", duration: "10s" },
  { top: "40%", left: "45%", size: 140, color: "var(--glow-gold)", delay: "3s", duration: "6.5s" },
];

const ACCENT_SPARKS = [
  { top: "18%", left: "20%", size: 7, color: "var(--gold)", delay: "0.2s", duration: "2.6s" },
  { top: "30%", left: "82%", size: 6, color: "var(--pink)", delay: "1.4s", duration: "3.1s" },
  { top: "68%", left: "12%", size: 8, color: "var(--maroon)", delay: "2.2s", duration: "2.8s" },
  { top: "78%", left: "70%", size: 6, color: "var(--gold)", delay: "0.8s", duration: "3.4s" },
];

export function SparkField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="absolute animate-pulse rounded-full blur-2xl"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            background: s.color,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
      {ACCENT_SPARKS.map((s, i) => (
        <span
          key={i}
          className="animate-spark absolute"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            background: s.color,
            clipPath: "polygon(50% 0%,63% 38%,100% 50%,63% 62%,50% 100%,37% 62%,0% 50%,37% 38%)",
            animationDelay: s.delay,
            animationDuration: "900ms",
            animationIterationCount: "infinite",
          }}
        />
      ))}
      <div className="absolute bottom-4 right-6">
        <DiyaIcon size={46} />
      </div>
    </div>
  );
}
