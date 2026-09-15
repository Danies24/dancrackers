/**
 * Small looping aerial firework — a dashed trail rising to a radiating
 * burst that pulses on a loop. Pure SVG + CSS, no JS. Purely decorative:
 * aria-hidden, no interactive semantics.
 */
interface SkyShotIconProps {
  size?: number;
  className?: string;
}

const RAY_COLORS = ["var(--gold)", "var(--pink)", "var(--maroon)", "var(--gold)", "var(--pink)", "var(--maroon)"];

export function SkyShotIcon({ size = 26, className }: SkyShotIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 pointer-events-none ${className ?? ""}`}
      style={{ width: size, height: size, position: "relative" }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <line
          x1="12"
          y1="22"
          x2="12"
          y2="13"
          stroke="var(--maroon-ink)"
          strokeWidth="1.4"
          strokeDasharray="2 2"
          strokeLinecap="round"
        />
        <g className="animate-sky-burst" style={{ transformOrigin: "12px 8px" }}>
          {RAY_COLORS.map((color, i) => {
            const angle = (i * 360) / RAY_COLORS.length;
            const rad = (angle * Math.PI) / 180;
            const x2 = 12 + Math.sin(rad) * 5;
            const y2 = 8 - Math.cos(rad) * 5;
            return (
              <line
                key={i}
                x1={12 + Math.sin(rad) * 1.5}
                y1={8 - Math.cos(rad) * 1.5}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            );
          })}
          <circle cx="12" cy="8" r="1.4" fill="var(--gold)" />
        </g>
      </svg>
    </span>
  );
}
