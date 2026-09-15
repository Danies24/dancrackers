"use client";

import { Lottie } from "lottie-react";

/**
 * Thin wrapper around lottie-react, ready for a real licensed Diwali
 * animation (diya/firework) once one is obtained. Not used anywhere yet —
 * DiyaIcon (pure SVG + CSS) is what ships today. Swapping a spot from
 * DiyaIcon to LottieAccent is a one-line change once animationData exists.
 */
interface LottieAccentProps {
  animationData: object;
  className?: string;
  loop?: boolean;
}

export function LottieAccent({ animationData, className, loop = true }: LottieAccentProps) {
  return (
    <span aria-hidden="true" className={`pointer-events-none inline-block ${className ?? ""}`}>
      <Lottie src={animationData} loop={loop} autoplay />
    </span>
  );
}
