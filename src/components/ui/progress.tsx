import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  // ✅ SAFE: value robuste (0..100)
  const numericValue = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const clampedValue = clamp(numericValue, 0, 100);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      // ✅ SAFE: Radix peut utiliser value/max pour a11y
      value={clampedValue}
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        // ✅ SAFE: transition ciblée (moins d'effets de bord que transition-all)
        className="h-full w-full flex-1 bg-primary transition-transform"
        style={{ transform: `translateX(-${100 - clampedValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
