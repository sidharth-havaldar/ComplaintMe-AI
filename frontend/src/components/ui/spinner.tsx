import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/** Accessible loading spinner. Provide `label` for screen readers. */
function Spinner({
  className,
  label = "Loading…",
  ...props
}: React.ComponentProps<"span"> & { label?: string }) {
  return (
    <span role="status" aria-live="polite" className={cn("inline-flex", className)} {...props}>
      <Loader2 aria-hidden="true" className="size-full animate-spin" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export { Spinner };
