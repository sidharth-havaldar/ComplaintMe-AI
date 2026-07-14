"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Mic, Paperclip, Sparkles } from "lucide-react";

import { FormAlert } from "@/components/auth/form-alert";
import { CortexaAnalysis } from "@/components/complaints/cortexa-analysis";
import { fadeUp } from "@/components/dashboard/motion";
import { Button } from "@/components/ui/button";
import { createComplaint } from "@/lib/api";
import { cn } from "@/lib/utils";

const MIN_DESCRIPTION_LENGTH = 20;

/**
 * The primary post-login experience: one question, one large text area, one
 * action. The user describes what happened; we create the complaint and hand
 * off to its detail page.
 *
 * CMP-003 submission behavior is preserved exactly — same validation, same
 * `createComplaint` call, same redirect and error handling. Only the surface is
 * redesigned into a premium, glass-like AI composer (UI-002). Attachments and
 * voice remain intentionally out of scope ("Coming Soon").
 */
export function ComplaintForm() {
  const router = useRouter();

  const [description, setDescription] = React.useState("");
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // UI-003: the full-screen "Cortexa is thinking" experience shown while the
  // complaint is created. `analyzing` mounts the overlay; `analyzedId` is the
  // created complaint's id, which both completes the animation (via `ready`)
  // and is the redirect target once the experience finishes.
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analyzedId, setAnalyzedId] = React.useState<string | null>(null);

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
    // Transition straight into the AI analysis experience — no blank loading.
    setAnalyzedId(null);
    setAnalyzing(true);
    try {
      const complaint = await createComplaint(trimmed);
      // Hand the id to the overlay: it releases the final step and, once its
      // sequence finishes, calls back to redirect. Behavior is unchanged — same
      // createComplaint call, same `/complaints/{id}` destination.
      setAnalyzedId(complaint.id);
    } catch {
      // Tear down the experience and surface the error on the composer.
      setAnalyzing(false);
      setFormError("Something went wrong while submitting your complaint. Please try again.");
      setIsSubmitting(false);
    }
  }

  /** Called by the analysis experience once it has finished narrating. */
  function handleAnalysisComplete() {
    if (analyzedId) {
      router.push(`/complaints/${analyzedId}`);
    }
  }

  /** Premium affordance: ⌘/Ctrl + Enter submits without leaving the keyboard. */
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <>
      <AnimatePresence>
        {analyzing && (
          <CortexaAnalysis ready={analyzedId !== null} onComplete={handleAnalysisComplete} />
        )}
      </AnimatePresence>

      <motion.form
        variants={fadeUp}
        onSubmit={handleSubmit}
        noValidate
        className="flex w-full flex-col gap-4"
        aria-label="Describe your complaint"
      >
        {formError && <FormAlert>{formError}</FormAlert>}

        {/* Glass composer surface — the focal point of the workspace. */}
        <div
          className={cn(
            "group/composer border-border/70 bg-card/70 relative rounded-3xl border p-2 shadow-xl ring-1 shadow-black/[0.04] ring-black/[0.02] backdrop-blur-xl transition-all duration-300",
            "focus-within:border-brand/40 focus-within:shadow-brand/10 focus-within:ring-brand/20",
            "dark:bg-card/60 dark:shadow-black/20"
          )}
        >
          {/* Ambient brand glow that intensifies on focus. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(30rem_20rem_at_50%_0%,color-mix(in_oklch,var(--brand)_10%,transparent),transparent_70%)] opacity-0 transition-opacity duration-500 group-focus-within/composer:opacity-100"
          />

          <label htmlFor="description" className="sr-only">
            Describe what happened
          </label>
          <textarea
            id="description"
            autoFocus
            rows={7}
            placeholder="Tell us what happened…"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              if (fieldError) {
                setFieldError(null);
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? "description-error" : "description-example"}
            className={cn(
              "min-h-44 w-full resize-y rounded-2xl bg-transparent p-4 text-base leading-relaxed",
              "placeholder:text-muted-foreground/70 transition-colors outline-none",
              "aria-invalid:text-foreground disabled:pointer-events-none disabled:opacity-50"
            )}
          />

          <p id="description-example" className="text-muted-foreground/70 px-4 pb-1 text-sm">
            <span className="font-medium">Example:</span>{" "}
            <span className="italic">
              “My OPPO F17 stopped working after two years of normal usage.”
            </span>
          </p>

          {/* Action bar: coming-soon affordances on the left, primary CTA on the right. */}
          <div className="border-border/60 flex flex-col gap-3 border-t p-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ComingSoonAction icon={Paperclip} label="Attach Evidence" />
              <ComingSoonAction icon={Mic} label="Voice Complaint" />
            </div>

            <Button
              type="submit"
              variant="brand"
              size="lg"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  Analyzing with Cortexa…
                </>
              ) : (
                <>
                  <Sparkles aria-hidden="true" className="size-4" />
                  Analyze with Cortexa
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-200 group-hover/button:translate-x-0.5"
                  />
                </>
              )}
            </Button>
          </div>
        </div>

        {fieldError ? (
          <p id="description-error" role="alert" className="text-destructive px-1 text-sm">
            {fieldError}
          </p>
        ) : (
          <p className="text-muted-foreground/70 px-1 text-xs">
            Press{" "}
            <kbd className="border-border bg-muted rounded border px-1.5 py-0.5 font-sans text-[0.7rem] font-medium">
              ⌘ Enter
            </kbd>{" "}
            to analyze. Your complaint is encrypted end to end.
          </p>
        )}
      </motion.form>
    </>
  );
}

/**
 * A disabled action pill that signals an upcoming capability without pretending
 * to work. Kept accessible: it's a real disabled button with a clear label.
 */
function ComingSoonAction({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled
      aria-label={`${label} (coming soon)`}
      className="border-border/70 bg-muted/40 text-muted-foreground inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
    >
      <Icon aria-hidden={true} className="size-3.5" />
      <span className="hidden sm:inline">{label}</span>
      <span className="text-muted-foreground/60">· Soon</span>
    </button>
  );
}
