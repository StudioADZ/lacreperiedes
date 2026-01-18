import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>

    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    aria-label={orientation === "vertical" ? "Défilement vertical" : "Défilement horizontal"}
    className={cn(
      "flex touch-none select-none transition-colors",
      // ✅ Cursor hint (safe)
      orientation === "vertical" && "cursor-row-resize h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "cursor-col-resize h-2.5 flex-col border-t border-t-transparent p-[1px]",
      // ✅ Bigger hitbox (non-visual): easier to grab on mobile
      "relative after:absolute after:inset-0 after:content-['']",
      orientation === "vertical" && "after:-left-2 after:w-[calc(100%+16px)]",
      orientation === "horizontal" && "after:-top-2 after:h-[calc(100%+16px)]",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
