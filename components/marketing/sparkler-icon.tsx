/**
 * Small looping electric sparkler — a stick with a fizzing, glowing tip and
 * a handful of rapid particle sparks. Pure SVG + CSS, no JS. Purely
 * decorative: aria-hidden, no interactive semantics.
 */
interface SparklerIconProps {
  size?: number;
  className?: string;
}

const FIZZ_PARTICLES = [
  { dx: -6, dy: -4, color: "var(--gold)", delay: "0s", duration: "1.1s" },
  { dx: 5, dy: -6, color: "var(--pink)", delay: "0.3s", duration: "1.3s" },
  { dx: -4, dy: -8, color: "var(--maroon)", delay: "0.6s", duration: "1s" },
  { dx: 6, dy: -2, color: "var(--gold)", delay: "0.15s", duration: "1.2s" },
];

export function SparklerIcon({ size = 26, className }: SparklerIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 pointer-events-none ${className ?? ""}`}
      style={{ width: size, height: size, position: "relative" }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <line x1="5" y1="21" x2="16" y2="8" stroke="var(--maroon-ink)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="17" cy="7" r="2" fill="var(--gold)" className="animate-sparkler-fizz" />
      </svg>
      {FIZZ_PARTICLES.map((p, i) => (
        <span
          key={i}
          className="animate-spark absolute h-[4px] w-[4px]"
          style={{
            top: `calc(29% + ${p.dy}px)`,
            left: `calc(71% + ${p.dx}px)`,
            background: p.color,
            clipPath: "polygon(50% 0%,63% 38%,100% 50%,63% 62%,50% 100%,37% 62%,0% 50%,37% 38%)",
            animationDelay: p.delay,
            animationDuration: p.duration,
            animationIterationCount: "infinite",
          }}
        />
      ))}
    </span>
  );
}
