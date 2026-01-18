import * as React from "react";
import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Si tu veux rendre le skeleton "annonçable" (accessibilité),
   * passe aria-hidden={false} + role="status" + aria-label="Chargement…"
   * Sinon par défaut, il est ignoré par les lecteurs d'écran.
   */
};

function Skeleton({ className, ...props }: SkeletonProps) {
  const ariaHidden = props["aria-hidden"] ?? true;

  return (
    <div
      aria-hidden={ariaHidden}
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
