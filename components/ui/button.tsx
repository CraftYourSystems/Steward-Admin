import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-fg text-bg shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-fg/90 hover:shadow-[0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.15)]",
        primary: "bg-accent text-accent-foreground shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-accent/90 hover:shadow-[0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.15)]",
        accent:  "bg-accent text-accent-foreground shadow-sm hover:bg-accent/90",
        secondary: "bg-surface-3 text-fg border border-border/50 hover:bg-surface-2 hover:border-border",
        outline: "border border-border/50 bg-transparent text-fg hover:bg-surface-2 hover:border-border",
        ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
        destructive: "bg-danger text-white shadow-sm hover:bg-danger/90",
        success: "bg-success text-white shadow-sm hover:bg-success/90",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        xl: "h-12 px-8 text-[15px]",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
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
