import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

type FormAlertProps = {
  variant?: "error" | "success";
  children: React.ReactNode;
};

/** Inline alert for form-level error and success messages. */
export function FormAlert({ variant = "error", children }: FormAlertProps) {
  const isError = variant === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm shadow-xs",
        "duration-300 animate-in fade-in-0 slide-in-from-top-1",
        isError
          ? "border-destructive/30 bg-destructive/8 text-destructive dark:bg-destructive/12"
          : "border-success/30 bg-success/8 text-success dark:bg-success/12"
      )}
    >
      <Icon aria-hidden="true" className="mt-px size-4 shrink-0" />
      <span className="[&_strong]:font-semibold">{children}</span>
    </div>
  );
}
