import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        // ✅ SAFE: fallback explicite, n’écrase rien si type est déjà fourni
        type={type ?? "text"}
        className={cn(
          // Base existante (inchangée)
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          // ✅ UX SAFE: évite les débordements dans des layouts flex/grid
          "min-w-0",
          // ✅ UX SAFE: meilleurs comportements iOS (sans changer le style)
          "appearance-none",
          // ✅ UX SAFE: si aria-invalid est utilisé ailleurs, on style sans imposer
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/30",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
