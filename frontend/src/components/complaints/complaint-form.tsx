"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip } from "lucide-react";

import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { createComplaint } from "@/lib/api";
import { cn } from "@/lib/utils";

const MIN_DESCRIPTION_LENGTH = 20;

/**
 * The primary post-login experience: one question, one large text area, one
 * action. The user describes what happened; we create the complaint and hand
 * off to its detail page. Everything else (AI analysis, attachments, voice) is
 * intentionally out of scope for CMP-003.
 */
export function ComplaintForm() {
  const router = useRouter();

  const [description, setDescription] = React.useState("");
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setFormError(null);

    const trimmed = description.trim();
    if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
      setFieldError(
        `Please share a little more — at least ${MIN_DESCRIPTION_LENGTH} characters so we can help.`
      );
      return;
    }

    setFieldError(null);
    setIsSubmitting(true);
    try {
      const complaint = await createComplaint(trimmed);
      // Keep the button disabled through the redirect for a calm transition.
      router.push(`/complaints/${complaint.id}`);
    } catch {
      setFormError("Something went wrong while submitting your complaint. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full max-w-2xl flex-col gap-8">
      <h1 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        Tell us what happened.
      </h1>

      {formError && <FormAlert>{formError}</FormAlert>}

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="sr-only">
          Describe what happened
        </label>
        <textarea
          id="description"
          autoFocus
          rows={8}
          placeholder="Start typing your complaint…"
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            if (fieldError) {
              setFieldError(null);
            }
          }}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? "description-error" : undefined}
          className={cn(
            "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 min-h-48 w-full resize-y rounded-xl border bg-transparent p-4 text-base leading-relaxed transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50"
          )}
        />
        {fieldError && (
          <p id="description-error" role="alert" className="text-destructive text-sm">
            {fieldError}
          </p>
        )}
      </div>

      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Paperclip aria-hidden="true" className="size-4" />
        <span>Attach evidence</span>
        <span className="text-xs">(Coming Soon)</span>
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Analyzing…
          </>
        ) : (
          "Analyze Complaint"
        )}
      </Button>
    </form>
  );
}
