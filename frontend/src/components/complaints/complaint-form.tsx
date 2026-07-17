"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Eraser,
  Loader2,
  Mic,
  Paperclip,
  PenLine,
  Send,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { FormAlert } from "@/components/auth/form-alert";
import { CortexaAnalysis } from "@/components/complaints/cortexa-analysis";
import { fadeUp } from "@/components/dashboard/motion";
import { Button } from "@/components/ui/button";
import { type ComplaintDraft, createComplaint, draftComplaint } from "@/lib/api";
import { cn } from "@/lib/utils";

const MIN_DESCRIPTION_LENGTH = 20;

/**
 * The Consumer Copilot drafting flow (COP-002), replacing the single-step
 * composer. Two steps:
 *
 *   1. "Tell us what happened." — the user describes their situation
 *      naturally in a large glass composer.
 *   2. Consumer Copilot returns a professional complaint draft, shown in a
 *      split view (original story left, professional complaint right). The
 *      draft is fully editable; submitting stores the professional complaint
 *      through the existing `createComplaint` call, after which Cortexa
 *      analyzes it exactly as before (UI-003 overlay + redirect preserved).
 */
export function ComplaintForm() {
  const router = useRouter();

  const [step, setStep] = React.useState<"story" | "review">("story");
  const [story, setStory] = React.useState("");
  const [draft, setDraft] = React.useState<ComplaintDraft | null>(null);

  // Editable draft fields (initialized from the Copilot draft, user-owned after).
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");

  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isDrafting, setIsDrafting] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // UI-003: the full-screen "Cortexa is thinking" experience shown while the
  // complaint is created. `analyzing` mounts the overlay; `analyzedId` is the
  // created complaint's id, which both completes the animation (via `ready`)
  // and is the redirect target once the experience finishes.
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analyzedId, setAnalyzedId] = React.useState<string | null>(null);

  async function handleCreateDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDrafting) {
      return;
    }

    setFormError(null);

    const trimmed = story.trim();
    if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
      setFieldError(
        `Please share a little more — at least ${MIN_DESCRIPTION_LENGTH} characters so we can help.`
      );
      return;
    }

    setFieldError(null);
    setIsDrafting(true);
    try {
      const result = await draftComplaint(trimmed);
      setDraft(result);
      setSubject(result.subject);
      setBody(result.body);
      setStep("review");
    } catch {
      setFormError(
        "Something went wrong while creating your professional complaint. Please try again."
      );
    } finally {
      setIsDrafting(false);
    }
  }

  function handleClear() {
    setStory("");
    setFieldError(null);
    setFormError(null);
  }

  function handleBackToStory() {
    setFormError(null);
    setStep("story");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setFormError(null);

    const trimmedBody = body.trim();
    if (trimmedBody.length < MIN_DESCRIPTION_LENGTH) {
      setFormError("The complaint text looks too short. Please add a little more detail.");
      return;
    }

    setIsSubmitting(true);
    // Transition straight into the AI analysis experience — no blank loading.
    setAnalyzedId(null);
    setAnalyzing(true);
    try {
      // The professional complaint becomes the stored complaint: the edited
      // body is the description, the subject line becomes the title. Same
      // createComplaint call and `/complaints/{id}` destination as before.
      const complaint = await createComplaint(trimmedBody, subject.trim() || undefined);
      setAnalyzedId(complaint.id);
    } catch {
      // Tear down the experience and surface the error on the review step.
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

  /** Premium affordance: ⌘/Ctrl + Enter advances without leaving the keyboard. */
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

      <AnimatePresence mode="wait" initial={false}>
        {step === "story" ? (
          <motion.form
            key="story"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -12, transition: { duration: 0.25 } }}
            onSubmit={handleCreateDraft}
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
                rows={9}
                placeholder="Tell us what happened…"
                value={story}
                onChange={(event) => {
                  setStory(event.target.value);
                  if (fieldError) {
                    setFieldError(null);
                  }
                }}
                onKeyDown={handleKeyDown}
                disabled={isDrafting}
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

              {/* Action bar: coming-soon affordances left, Clear + primary CTA right. */}
              <div className="border-border/60 flex flex-col gap-3 border-t p-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ComingSoonAction icon={Paperclip} label="Attach Evidence" />
                  <ComingSoonAction icon={Mic} label="Voice Complaint" />
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={handleClear}
                    disabled={isDrafting || story.length === 0}
                    className="w-full sm:w-auto"
                  >
                    <Eraser aria-hidden="true" className="size-4" />
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    variant="brand"
                    size="lg"
                    disabled={isDrafting}
                    className="w-full sm:w-auto"
                  >
                    {isDrafting ? (
                      <>
                        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                        Drafting your complaint…
                      </>
                    ) : (
                      <>
                        <WandSparkles aria-hidden="true" className="size-4" />
                        Create Professional Complaint
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 transition-transform duration-200 group-hover/button:translate-x-0.5"
                        />
                      </>
                    )}
                  </Button>
                </div>
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
                to create your draft. Your complaint is encrypted end to end.
              </p>
            )}
          </motion.form>
        ) : (
          <motion.form
            key="review"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.25 } }}
            onSubmit={handleSubmit}
            noValidate
            className="flex w-full flex-col gap-5"
            aria-label="Review your professional complaint"
          >
            {formError && <FormAlert>{formError}</FormAlert>}

            {/* Split view: original story (left) · professional complaint (right). */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_3fr]">
              {/* Original story */}
              <section
                aria-labelledby="original-story-heading"
                className="border-border/70 bg-card/50 flex flex-col rounded-3xl border p-6 shadow-lg shadow-black/[0.03] backdrop-blur-xl sm:p-7 dark:shadow-black/20"
              >
                <div className="flex items-center gap-2">
                  <span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full">
                    <PenLine aria-hidden="true" className="size-3.5" />
                  </span>
                  <h2
                    id="original-story-heading"
                    className="font-heading text-sm font-semibold tracking-tight"
                  >
                    Original Story
                  </h2>
                </div>
                <p className="text-muted-foreground mt-1.5 text-xs">
                  What you told us, in your own words.
                </p>
                <p className="text-foreground/80 mt-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {story}
                </p>
              </section>

              {/* Professional complaint draft */}
              <section
                aria-labelledby="draft-heading"
                className={cn(
                  "group/draft border-brand/25 bg-card/70 relative flex flex-col gap-5 rounded-3xl border p-6 shadow-xl ring-1 shadow-black/[0.04] ring-black/[0.02] backdrop-blur-xl sm:p-7",
                  "dark:bg-card/60 dark:shadow-black/20"
                )}
              >
                {/* Ambient brand glow behind the draft. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(28rem_18rem_at_50%_0%,color-mix(in_oklch,var(--brand)_8%,transparent),transparent_70%)]"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-brand/10 text-brand flex size-7 items-center justify-center rounded-full">
                      <Sparkles aria-hidden="true" className="size-3.5" />
                    </span>
                    <h2
                      id="draft-heading"
                      className="font-heading text-sm font-semibold tracking-tight"
                    >
                      Professional Complaint Draft
                    </h2>
                  </div>
                  <span className="border-brand/20 bg-brand/10 text-brand rounded-full border px-2.5 py-1 text-[0.65rem] font-medium tracking-wide uppercase">
                    Editable
                  </span>
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="draft-subject"
                    className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
                  >
                    Subject
                  </label>
                  <input
                    id="draft-subject"
                    type="text"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    disabled={isSubmitting}
                    maxLength={255}
                    className={cn(
                      "border-border/70 bg-background/60 rounded-xl border px-3.5 py-2.5 text-sm font-medium",
                      "focus-visible:border-brand/40 focus-visible:ring-brand/20 transition-colors outline-none focus-visible:ring-2",
                      "disabled:pointer-events-none disabled:opacity-50"
                    )}
                  />
                </div>

                {/* Recipient + summary + resolution — read-only context chips. */}
                {draft && (
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="border-border/60 bg-background/40 rounded-xl border px-3.5 py-2.5">
                      <dt className="text-muted-foreground text-[0.65rem] font-medium tracking-wide uppercase">
                        Recipient
                      </dt>
                      <dd className="text-foreground/90 mt-0.5 text-sm">{draft.recipient}</dd>
                    </div>
                    <div className="border-border/60 bg-background/40 rounded-xl border px-3.5 py-2.5">
                      <dt className="text-muted-foreground text-[0.65rem] font-medium tracking-wide uppercase">
                        Requested Resolution
                      </dt>
                      <dd className="text-foreground/90 mt-0.5 text-sm">
                        {draft.requested_resolution}
                      </dd>
                    </div>
                    <div className="border-border/60 bg-background/40 rounded-xl border px-3.5 py-2.5 sm:col-span-2">
                      <dt className="text-muted-foreground text-[0.65rem] font-medium tracking-wide uppercase">
                        Summary
                      </dt>
                      <dd className="text-foreground/90 mt-0.5 text-sm">{draft.summary}</dd>
                    </div>
                  </dl>
                )}

                {/* Timeline — only when the story contained time references. */}
                {draft && draft.timeline.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-muted-foreground flex items-center gap-1.5 text-[0.65rem] font-medium tracking-wide uppercase">
                      <CalendarClock aria-hidden="true" className="size-3.5" />
                      Timeline
                    </h3>
                    <ol className="border-border/60 flex flex-col gap-2 border-l pl-4">
                      {draft.timeline.map((entry) => (
                        <li key={entry} className="text-foreground/85 relative text-sm">
                          <span
                            aria-hidden="true"
                            className="bg-brand/60 absolute top-1.5 -left-[1.185rem] size-1.5 rounded-full"
                          />
                          {entry}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Complaint body — the text that becomes the stored complaint. */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="draft-body"
                    className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
                  >
                    Complaint
                  </label>
                  <textarea
                    id="draft-body"
                    rows={12}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitting}
                    className={cn(
                      "border-border/70 bg-background/60 min-h-64 w-full resize-y rounded-xl border p-3.5 text-sm leading-relaxed",
                      "focus-visible:border-brand/40 focus-visible:ring-brand/20 transition-colors outline-none focus-visible:ring-2",
                      "disabled:pointer-events-none disabled:opacity-50"
                    )}
                  />
                  <p className="text-muted-foreground/70 text-xs">
                    Review and edit freely — anything in brackets like [Your Name] is a
                    placeholder we couldn&apos;t fill from your story. Nothing was invented on
                    your behalf.
                  </p>
                </div>
              </section>
            </div>

            {/* Review actions. */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={handleBackToStory}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Edit Original Story
              </Button>
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
                    <Send aria-hidden="true" className="size-4" />
                    Submit Complaint
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-200 group-hover/button:translate-x-0.5"
                    />
                  </>
                )}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
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
