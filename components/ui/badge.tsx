import { cn } from "@/lib/utils";

type BadgeVariant = "net-rate" | "bestseller" | "unavailable";

const variantClasses: Record<BadgeVariant, string> = {
  "net-rate": "bg-gold-tint text-gold",
  bestseller: "bg-maroon-tint text-maroon",
  unavailable: "bg-white/10 text-ink-soft",
};

const variantLabel: Record<BadgeVariant, string> = {
  "net-rate": "NET RATE",
  bestseller: "BESTSELLER",
  unavailable: "UNAVAILABLE",
};

export function Badge({ variant, className }: { variant: BadgeVariant; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        variantClasses[variant],
        className,
      )}
    >
      {variantLabel[variant]}
    </span>
  );
}
