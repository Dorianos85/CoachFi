import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-bold",
  {
    variants: {
      variant: {
        default: "border-primary/15 bg-primary/10 text-primary",
        success: "border-success/40 bg-success text-text",
        warning: "border-warning/40 bg-warning text-text",
        muted: "border-border-subtle bg-bg text-muted",
        accent: "border-accent/50 bg-accent text-text"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
