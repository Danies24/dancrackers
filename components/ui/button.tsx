import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button variants — Dark Diwali 2026 design system. Pill-shaped, gradient
 * primary CTA, subtle lift-on-hover / press-to-shrink. WhatsApp green stays
 * the one non-palette colour (recognisability beats consistency there).
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-40 min-h-11 active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-primary text-on-fill shadow-[0_0_0_rgba(0,0,0,0)] hover:-translate-y-0.5 hover:glow-orange",
        secondary:
          "border border-border text-ink bg-transparent hover:-translate-y-0.5 hover:border-maroon-ink hover:glow-orange",
        ghost: "text-maroon-ink bg-transparent hover:bg-maroon-tint",
        whatsapp: "bg-whatsapp text-white hover:brightness-95 hover:-translate-y-0.5",
      },
      size: {
        default: "h-12 md:h-11 px-6",
        sm: "h-10 px-4 text-sm",
        full: "h-12 md:h-11 px-6 w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";
