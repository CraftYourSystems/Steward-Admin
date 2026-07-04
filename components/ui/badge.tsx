import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors border border-transparent",
  {
    variants: {
      variant: {
        default: "bg-surface-3 text-fg",
        neutral: "bg-surface-2 text-fg-muted",
        accent: "bg-accent/10 text-accent",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        danger:  "bg-danger/15 text-danger",
        info:    "bg-info/15 text-info",
        outline: "border-border/50 bg-transparent text-fg-muted",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export { Badge, badgeVariants };
