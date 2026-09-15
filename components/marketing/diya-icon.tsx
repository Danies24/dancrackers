/**
 * Small looping animated diya (oil lamp) — pure SVG + CSS keyframes, no JS.
 * Purely decorative: aria-hidden, no interactive semantics. Reduced-motion
 * is handled globally in globals.css (zeroes animation-duration on `*`).
 */
interface DiyaIconProps {
  /** Rendered width/height in px. */
  size?: number;
  className?: string;
}

const ACCENT_SPARKS = [
  { top: "-6px", left: "-4px", color: "var(--gold)", delay: "0.3s", duration: "2.1s" },
  { top: "2px", left: "100%", color: "var(--pink)", delay: "1.1s", duration: "2.4s" },
];

export function DiyaIcon({ size = 26, className }: DiyaIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 pointer-events-none ${className ?? ""}`}
      style={{ width: size, height: size, position: "relative" }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size}>
        {/* Lamp bowl */}
        <path d="M4 15.5c0 3.6 3.6 5.3 8 5.3s8-1.7 8-5.3H4Z" fill="var(--maroon-ink)" />
        <ellipse cx="12" cy="15.5" rx="8" ry="1.8" fill="var(--maroon-ink)" />
        {/* Flame group — animated */}
        <g className="animate-diya-flicker">
          <path
            d="M12 3.2c1.6 2.1 2.6 3.9 2.6 5.5a2.6 2.6 0 1 1-5.2 0c0-1.6 1-3.4 2.6-5.5Z"
            fill="var(--gold)"
          />
          <path
            d="M12 5.6c.9 1.3 1.4 2.3 1.4 3.1a1.4 1.4 0 1 1-2.8 0c0-.8.5-1.8 1.4-3.1Z"
            fill="var(--maroon)"
          />
        </g>
      </svg>
      {ACCENT_SPARKS.map((s, i) => (
        <span
          key={i}
          className="animate-spark absolute h-[5px] w-[5px]"
          style={{
            top: s.top,
            left: s.left,
            background: s.color,
            clipPath: "polygon(50% 0%,63% 38%,100% 50%,63% 62%,50% 100%,37% 62%,0% 50%,37% 38%)",
            animationDelay: s.delay,
            animationDuration: s.duration,
            animationIterationCount: "infinite",
          }}
        />
      ))}
    </span>
  );
}
