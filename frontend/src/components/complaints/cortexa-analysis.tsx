"use client";

import * as React from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion, useSpring } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

/**
 * UI-003 — the "Cortexa is thinking" experience.
 *
 * A full-screen, calm analysis surface shown in the gap between submitting a
 * complaint and landing on its detail page. It replaces the old robotic
 * "click → instant redirect" with a sequence of animated understanding steps,
 * an elegant progress indicator, a breathing logo, and rotating microcopy.
 *
 * Purely presentational and time-based: it introduces NO backend, API, auth or
 * complaint-logic changes. The real work is the parent's `createComplaint`
 * call; this component simply narrates it and waits for `ready` (the network
 * result) before it will complete and hand back control via `onComplete`.
 */

/** The understanding steps, revealed and checked off one by one. */
const STEPS = [
  "Reading complaint",
  "Understanding context",
  "Detecting company",
  "Detecting product",
  "Classifying complaint",
  "Understanding customer emotion",
  "Calculating severity",
  "Estimating priority",
  "Building executive summary",
  "Preparing insights",
] as const;

/** Small AI status lines that rotate underneath the progress bar. */
const MICROCOPY = [
  "Understanding the complaint…",
  "Looking for important entities…",
  "Extracting customer intent…",
  "Preparing structured insights…",
  "Almost done…",
] as const;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

type CortexaAnalysisProps = {
  /**
   * True once the complaint has actually been created. The sequence holds on
   * its final step until this flips, so the UI never claims to be finished
   * before the network is — and never blocks if the network is faster than the
   * animation.
   */
  ready: boolean;
  /** Called ~600ms after the "Analysis complete" moment, to navigate away. */
  onComplete: () => void;
};

export function CortexaAnalysis({ ready, onComplete }: CortexaAnalysisProps) {
  const reduce = useReducedMotion() ?? false;

  // `current` is the index of the step being processed right now. Steps before
  // it are done (✓); the step at it is active (spinner); steps after it are
  // not yet revealed. Reaching STEPS.length means everything is done.
  const [current, setCurrent] = React.useState(0);
  const [microIndex, setMicroIndex] = React.useState(0);
  const complete = current >= STEPS.length;

  // Focus the dialog on mount so screen-reader / keyboard users are moved into
  // the analysis context and its live updates are announced.
  const dialogRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Advance through the steps on a timer. The last step is gated on `ready` so
  // the sequence pauses ("Preparing insights…") until the complaint exists.
  React.useEffect(() => {
    if (current >= STEPS.length) return;

    const completingLastStep = current === STEPS.length - 1;
    if (completingLastStep && !ready) return;

    const delay = reduce ? 130 : current === 0 ? 420 : 340 + (current % 3) * 120;
    const timer = setTimeout(() => setCurrent((step) => step + 1), delay);
    return () => clearTimeout(timer);
  }, [current, ready, reduce]);

  // Once every step is checked off, celebrate briefly, then hand back control.
  React.useEffect(() => {
    if (!complete) return;
    const timer = setTimeout(onComplete, 600);
    return () => clearTimeout(timer);
  }, [complete, onComplete]);

  // Rotate the microcopy while work is in progress; stop once complete.
  React.useEffect(() => {
    if (complete) return;
    const timer = setInterval(() => {
      setMicroIndex((index) => (index + 1) % MICROCOPY.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [complete]);

  const percent = Math.round((Math.min(current, STEPS.length) / STEPS.length) * 100);
  const displayPercent = useAnimatedPercent(percent, reduce);

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Cortexa is analyzing your complaint"
        tabIndex={-1}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="bg-background/95 bg-ambient fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-5 py-10 backdrop-blur-xl outline-none"
      >
        <motion.div
          initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.05 }}
          className="flex w-full max-w-lg flex-col items-center text-center"
        >
          <BreathingLogo complete={complete} reduce={reduce} />

          {/* Headline + subtitle. The headline swaps to a completion message. */}
          <div className="mt-8 min-h-[4.5rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.h1
                key={complete ? "done" : "working"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
              >
                {complete ? "Analysis complete" : "Cortexa is understanding your complaint"}
              </motion.h1>
            </AnimatePresence>
            {!complete && (
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                This usually takes only a few seconds.
              </p>
            )}
          </div>

          {/* Progress bar + live percentage. */}
          <div className="mt-8 w-full max-w-sm">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">
                {complete ? "Done" : "Analyzing"}
              </span>
              <span
                className="text-brand font-semibold tabular-nums"
                aria-live="polite"
                aria-atomic="true"
              >
                {displayPercent}%
              </span>
            </div>
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <motion.div
                className="from-brand h-full rounded-full bg-gradient-to-r to-[color-mix(in_oklch,var(--brand),white_25%)]"
                initial={{ width: "0%" }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: reduce ? 0 : 0.6, ease: EASE_OUT }}
              />
            </div>
          </div>

          {/* Steps, revealed and checked off one by one. */}
          <ol
            className="mt-8 flex w-full max-w-sm flex-col gap-1 text-left"
            aria-label="Analysis steps"
          >
            <AnimatePresence initial={false}>
              {STEPS.map((label, index) => {
                if (index > current) return null;
                const done = index < current;
                return (
                  <motion.li
                    key={label}
                    initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.34, ease: EASE_OUT }}
                    className="flex items-center gap-3 py-1"
                  >
                    <StepIcon done={done} reduce={reduce} />
                    <span
                      className={cn(
                        "text-sm transition-colors duration-300",
                        done ? "text-foreground/80" : "text-foreground font-medium"
                      )}
                    >
                      {label}
                      {done ? "" : "…"}
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>

          {/* Rotating AI microcopy. */}
          <div className="mt-6 h-5" aria-hidden="true">
            <AnimatePresence mode="wait" initial={false}>
              {!complete && (
                <motion.p
                  key={microIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                  className="text-muted-foreground/80 text-xs"
                >
                  {MICROCOPY[microIndex]}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </MotionConfig>
  );
}

/** The large Cortexa mark with a soft breathing glow and expanding rings. */
function BreathingLogo({ complete, reduce }: { complete: boolean; reduce: boolean }) {
  return (
    <div className="relative flex size-20 items-center justify-center">
      {/* Soft glow that breathes behind the mark. */}
      <motion.span
        aria-hidden="true"
        className={cn(
          "absolute -inset-4 rounded-full blur-2xl transition-colors duration-500",
          complete ? "bg-success/25" : "bg-brand/25"
        )}
        animate={
          reduce || complete
            ? { opacity: 0.5 }
            : { opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.06, 0.95] }
        }
        transition={{ duration: 3, repeat: complete ? 0 : Infinity, ease: "easeInOut" }}
      />

      {/* Expanding rings — the "AI pulse". Suppressed for reduced motion. */}
      {!reduce &&
        !complete &&
        [0, 1].map((ring) => (
          <motion.span
            key={ring}
            aria-hidden="true"
            className="ring-brand/30 absolute inset-0 rounded-2xl ring-1"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.8 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: ring * 1.2 }}
          />
        ))}

      <LogoMark className="relative size-16 rounded-2xl [&_svg]:size-8" />

      {/* Success check that scales in when analysis is complete. */}
      <AnimatePresence>
        {complete && (
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            className="bg-success ring-background absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full text-white ring-4"
          >
            <Check className="size-4" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Per-step leading icon: a spinning loader while active, a check when done. */
function StepIcon({ done, reduce }: { done: boolean; reduce: boolean }) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
        done ? "bg-success/12 text-success" : "bg-brand/12 text-brand"
      )}
    >
      {done ? (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: EASE_OUT }}
        >
          <Check className="size-3.5" strokeWidth={3} />
        </motion.span>
      ) : (
        <Loader2 className={cn("size-3.5", !reduce && "animate-spin")} />
      )}
    </span>
  );
}

/**
 * Smoothly animates the displayed percentage toward its target. Reduced-motion
 * users get the exact value immediately, with no spring.
 */
function useAnimatedPercent(target: number, reduce: boolean): number {
  const [display, setDisplay] = React.useState(0);
  const spring = useSpring(0, { stiffness: 80, damping: 20, restDelta: 0.5 });

  React.useEffect(() => {
    if (reduce) {
      setDisplay(target);
      return;
    }
    spring.set(target);
  }, [target, reduce, spring]);

  React.useEffect(() => {
    if (reduce) return;
    return spring.on("change", (value) => setDisplay(Math.round(value)));
  }, [spring, reduce]);

  return reduce ? target : display;
}
