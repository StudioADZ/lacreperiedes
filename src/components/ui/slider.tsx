import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
  /**
   * Label a11y optionnel pour les thumbs si tu n’en fournis pas via un label externe.
   * Si plusieurs thumbs, il sera appliqué à tous (sinon tu peux gérer en wrapper).
   */
  thumbAriaLabel?: string;
};

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  (
    { className, trackClassName, rangeClassName, thumbClassName, thumbAriaLabel, ...props },
    ref
  ) => {
    // ✅ SAFE: support mono OU multi-thumb
    const value = (props.value ?? props.defaultValue) as number[] | undefined;
    const thumbsCount = Array.isArray(value) ? value.length : 1;

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        {...props}
      >
        <SliderPrimitive.Track
          className={cn("relative h-2 w-full grow overflow-hidden rounded-full bg-secondary", trackClassName)}
        >
          <SliderPrimitive.Range className={cn("absolute h-full bg-primary", rangeClassName)} />
        </SliderPrimitive.Track>

        {Array.from({ length: thumbsCount }).map((_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            aria-label={thumbAriaLabel}
            className={cn(
              "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              thumbClassName
            )}
          />
        ))}
      </SliderPrimitive.Root>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
