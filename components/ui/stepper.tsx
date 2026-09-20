import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  value: number;
  min?: number;
  onIncrement: () => void;
  onDecrement: () => void;
  label: string; // for aria-labels, e.g. product name
  className?: string;
}

/** 40×40 touch targets, tabular figures, "−" enabled down to min (defaults to 0 so 1 -> 0 removes item) (§13.2, §25.5). */
export function Stepper({ value, min = 0, onIncrement, onDecrement, label, className }: StepperProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={onDecrement}
        disabled={value <= min}
        aria-label={`Decrease quantity of ${label}`}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-ink-soft transition-colors hover:border-maroon-ink hover:text-maroon-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-ink-soft"
      >
        <Minus size={16} aria-hidden />
      </button>
      <span
        className="tabular-nums flex h-10 w-11 items-center justify-center text-[16px] font-semibold"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label={`Increase quantity of ${label}`}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-ink-soft transition-colors hover:border-maroon-ink hover:text-maroon-ink"
      >
        <Plus size={16} aria-hidden />
      </button>
    </div>
  );
}
