import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/** Gradient app mark — a rounded tile with the AI spark. */
export function LogoMark({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "from-brand inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br to-[color-mix(in_oklch,var(--brand),black_18%)] text-white shadow-sm shadow-brand/30 ring-1 ring-white/10",
        className
      )}
      {...props}
    >
      <Sparkles className="size-5" />
    </span>
  );
}

/** Full brand lockup: mark + wordmark. */
export function Wordmark({
  className,
  showMark = true,
  ...props
}: React.ComponentProps<"span"> & { showMark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} {...props}>
      {showMark && <LogoMark />}
      <span className="text-lg font-semibold tracking-tight">
        ComplaintMe <span className="text-brand">AI</span>
      </span>
    </span>
  );
}
