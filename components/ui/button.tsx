import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button variants per PRD §25.5. One primary per screen. WhatsApp green is
 * the only place a non-palette colour is permitted (recognisability beats
 * consistency there).
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-[16px] font-semibold transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-40 min-h-11",
  {
    variants: {
      variant: {
        primary: "bg-maroon text-white hover:bg-maroon-dark",
        secondary: "border-2 border-maroon text-maroon bg-transparent hover:bg-maroon-tint",
        ghost: "text-maroon bg-transparent hover:bg-maroon-tint",
        whatsapp: "bg-whatsapp text-white hover:brightness-95",
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
