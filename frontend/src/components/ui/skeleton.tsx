import { cn } from "@/lib/utils";

/** Placeholder shimmer block for content that is loading. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("skeleton-shimmer bg-muted/60 rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
