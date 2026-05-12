import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 whitespace-normal break-normal rounded-lg text-center text-sm font-bold leading-snug [overflow-wrap:normal] [word-break:normal] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-glow hover:bg-primary/90",
        secondary: "bg-secondary text-text hover:bg-secondary/85",
        accent: "bg-accent text-text hover:bg-accent/90",
        success: "bg-success text-text hover:bg-success/90",
        outline: "border border-primary/20 bg-white text-text hover:bg-primary/5",
        ghost: "text-text hover:bg-white/70"
      },
      size: {
        default: "px-5 py-3",
        sm: "min-h-9 px-3 py-2 text-xs",
        lg: "min-h-14 px-6 py-4 text-base",
        icon: "h-11 w-11 p-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
