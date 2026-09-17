"use client";

import type { CSSProperties } from "react";

interface Particle {
  x: number;
  y: number;
  color: string;
  delay: string;
}

const PARTICLES: Particle[] = [
  { x: 26, y: -18, color: "var(--gold)", delay: "0ms" },
  { x: -24, y: -20, color: "var(--pink)", delay: "40ms" },
  { x: 30, y: 10, color: "var(--maroon)", delay: "20ms" },
  { x: -28, y: 8, color: "var(--gold)", delay: "60ms" },
  { x: 8, y: -28, color: "var(--pink)", delay: "10ms" },
  { x: -8, y: 24, color: "var(--maroon)", delay: "50ms" },
  { x: 20, y: 22, color: "var(--gold)", delay: "30ms" },
  { x: -20, y: -6, color: "var(--pink)", delay: "70ms" },
];

/**
 * One-shot radiating spark burst — the visual half of the cart milestone
 * celebration (components/cart/use-cart-milestone-celebration.ts). Mount it
 * keyed by `celebration.key` so React remounts it (and so the CSS animation
 * replays) on every new crossing, never looping on its own.
 */
export function CrackerBurst() {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="animate-firecracker-burst absolute left-1/2 top-1/2 h-[7px] w-[7px]"
          style={
            {
              background: p.color,
              clipPath: "polygon(50% 0%,63% 38%,100% 50%,63% 62%,50% 100%,37% 62%,0% 50%,37% 38%)",
              animationDelay: p.delay,
              "--burst-x": `${p.x}px`,
              "--burst-y": `${p.y}px`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
