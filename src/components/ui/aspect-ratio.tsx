import * as React from "react";
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

/**
 * AspectRatio
 * Wrapper autour de Radix UI pour garder une API interne stable
 * et permettre des extensions futures sans refactor global.
 */
const AspectRatio = React.forwardRef<
  React.ElementRef<typeof AspectRatioPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>
>(({ ...props }, ref) => (
  <AspectRatioPrimitive.Root ref={ref} {...props} />
));

AspectRatio.displayName = "AspectRatio";

export { AspectRatio };
