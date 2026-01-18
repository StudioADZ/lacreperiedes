import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Met le champ en état "erreur" (accessibilité + style).
   * Par défaut: false (aucun changement).
   */
  invalid?: boolean;
  /**
   * Contrôle le resize CSS.
   * Par défaut: "both" (comportement navigateur habituel).
   */
  resize?: "none" | "y" | "x" | "both";
}

const resizeClass: Record<NonNullable<TextareaProps["resize"]>, string> = {
  none: "resize-none",
  y: "resize-y",
  x: "resize-x",
  both: "resize",
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid = false, resize = "both", ...props }, ref) => {
    return (
      <textarea
        data-slot="textarea"
        aria-invalid={invalid || props["aria-invalid"] === true ? true : undefined}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          resizeClass[resize],
          invalid && "border-destructive focus-visible:ring-destructive",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
