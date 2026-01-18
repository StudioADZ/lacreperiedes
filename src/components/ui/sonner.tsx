import * as React from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const normalizeTheme = (theme: string): ToasterProps["theme"] => {
  if (theme === "light" || theme === "dark" || theme === "system") return theme;
  // ✅ fallback safe (ne change pas la logique)
  return "system";
};

const Toaster = ({ className, toastOptions, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={normalizeTheme(String(theme))}
      className={`toaster group ${className ?? ""}`.trim()}
      toastOptions={{
        // ✅ merge safe: on garde les defaults, on laisse l’extension
        ...toastOptions,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          ...(toastOptions?.classNames ?? {}),
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
