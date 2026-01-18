import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  [
    "relative w-full rounded-lg border p-4",
    // If an icon (svg) is provided as a direct child, align content nicely
    "[&>svg~*]:pl-7",
    "[&>svg+div]:translate-y-[-3px]",
    "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",

        // ✅ Optional, safe additions (won’t affect existing usage)
        success:
          "border-herb/30 bg-herb/5 text-foreground [&>svg]:text-herb",
        warning:
          "border-caramel/30 bg-caramel/5 text-foreground [&>svg]:text-caramel",
        info:
          "border-primary/25 bg-primary/5 text-foreground [&>svg]:text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName
