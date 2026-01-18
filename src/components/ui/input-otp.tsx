import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Dot } from "lucide-react";

import { cn } from "@/lib/utils";

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      // Base existante (inchangée)
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      // ✅ UX SAFE: wrap sur petits écrans + évite débordement
      "flex-wrap",
      containerClassName,
    )}
    className={cn(
      // Base existante (inchangée)
      "disabled:cursor-not-allowed",
      // ✅ UX SAFE: focus visible sur le container input-otp (sans casser)
      "outline-none",
      className,
    )}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Base existante (inchangée)
      "flex items-center",
      // ✅ UX SAFE: permet le scroll horizontal si groupe long (OTP 8+)
      "max-w-full overflow-x-auto",
      // ✅ UX SAFE: espace visuel propre si overflow
      "rounded-md",
      className,
    )}
    {...props}
  />
));
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);

  // ✅ Guard SAFE: si slots pas prêts (évite crash rare en hydration/SSR)
  const slot = inputOTPContext?.slots?.[index];
  const char = slot?.char ?? "";
  const hasFakeCaret = !!slot?.hasFakeCaret;
  const isActive = !!slot?.isActive;

  return (
    <div
      ref={ref}
      className={cn(
        // Base existante (inchangée)
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        // ✅ UX SAFE: focus ring seulement si actif
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        // ✅ UX SAFE: meilleure lisibilité + tap target
        "select-none",
        // ✅ UX SAFE: style disabled lisible (si utilisé côté lib)
        "data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} role="separator" className={cn("text-muted-foreground", className)} {...props}>
    <Dot className="h-4 w-4" />
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
