import { useToast, toast } from "@/hooks/use-toast";

// Exports legacy (compat)
export { useToast, toast };

// Exports explicites (anti-confusion avec sonner)
export { useToast as useRadixToast, toast as radixToast };
