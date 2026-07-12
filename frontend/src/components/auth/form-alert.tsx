import { cn } from "@/lib/utils";

type FormAlertProps = {
  variant?: "error" | "success";
  children: React.ReactNode;
};

/** Inline alert for form-level error and success messages. */
export function FormAlert({ variant = "error", children }: FormAlertProps) {
  const isError = variant === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        isError
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      )}
    >
      {children}
    </div>
  );
}
