/**
 * Minimal decorative "distant fireworks" — a handful of soft radial-gradient
 * blobs that slowly drift/twinkle. Pure CSS, no canvas, no imagery of real
 * people. Respects prefers-reduced-motion via the global rule in
 * globals.css (animation-duration is zeroed there).
 */
const SPARKS = [
  { top: "12%", left: "8%", size: 180, color: "var(--glow-orange)", delay: "0s", duration: "7s" },
  { top: "22%", left: "78%", size: 220, color: "var(--glow-pink)", delay: "1.2s", duration: "9s" },
  { top: "60%", left: "18%", size: 160, color: "var(--glow-gold)", delay: "2.4s", duration: "8s" },
  { top: "72%", left: "62%", size: 200, color: "var(--glow-orange)", delay: "0.6s", duration: "10s" },
  { top: "40%", left: "45%", size: 140, color: "var(--glow-gold)", delay: "3s", duration: "6.5s" },
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
    </div>
  );
}
