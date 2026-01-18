import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

const Collapsible = CollapsiblePrimitive.Root;

// ✅ Fix Radix exports
const CollapsibleTrigger = CollapsiblePrimitive.Trigger;
const CollapsibleContent = CollapsiblePrimitive.Content;

// (optionnel mais safe) DX
// @ts-expect-error displayName is fine for debugging
Collapsible.displayName = "Collapsible";
// @ts-expect-error displayName is fine for debugging
CollapsibleTrigger.displayName = "CollapsibleTrigger";
// @ts-expect-error displayName is fine for debugging
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
