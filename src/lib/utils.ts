import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn: combine class names + merge Tailwind conflicts safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}
