import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  value: number;
  min?: number;
  onIncrement: () => void;
  onDecrement: () => void;
  label: string;
  className?: string;
  size?: "default" | "sm" | "xs";
}

export function Stepper({
  value,
  min = 0,
  onIncrement,
  onDecrement,
  label,
  className,
  size = "default",
}: StepperProps) {
  const isSm = size === "sm";
  const isXs = size === "xs";

  return (
    <div className={cn("flex items-center gap-0.5", !isXs && "sm:gap-1", className)}>
      <button
        type="button"
        onClick={onDecrement}
        disabled={value <= min}
        aria-label={`Decrease quantity of ${label}`}
        className={cn(
          "flex items-center justify-center border border-border bg-surface text-ink-soft transition-colors hover:border-maroon-ink hover:text-maroon-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-ink-soft",
          isXs ? "h-6 w-6 rounded-md" : isSm ? "h-7 w-7 rounded-lg sm:h-8 sm:w-8" : "h-10 w-10 rounded-full",
        )}
      >
        <Minus size={isXs ? 11 : isSm ? 13 : 16} aria-hidden />
      </button>
      <span
        className={cn(
          "tabular-nums flex items-center justify-center font-semibold text-ink",
          isXs ? "h-6 min-w-4 px-0.5 text-[10px]" : isSm ? "h-7 min-w-5 px-1 text-xs sm:h-8 sm:min-w-6 sm:text-sm" : "h-10 w-11 text-[16px]",
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label={`Increase quantity of ${label}`}
        className={cn(
          "flex items-center justify-center border border-border bg-surface text-ink-soft transition-colors hover:border-maroon-ink hover:text-maroon-ink",
          isXs ? "h-6 w-6 rounded-md" : isSm ? "h-7 w-7 rounded-lg sm:h-8 sm:w-8" : "h-10 w-10 rounded-full",
        )}
      >
        <Plus size={isXs ? 11 : isSm ? 13 : 16} aria-hidden />
      </button>
    </div>
  );
}
