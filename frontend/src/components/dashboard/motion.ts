import type { Variants } from "framer-motion";

/**
 * Shared Framer Motion variants for the dashboard.
 *
 * Kept intentionally small and calm: a single "fade + slide up" gesture and a
 * container that staggers its children. Wrapping the workspace in
 * `<MotionConfig reducedMotion="user">` makes all of these honor the user's
 * prefers-reduced-motion setting automatically, so we never animate transforms
 * for people who have asked us not to.
 */

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Fade in while gently rising into place. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

/** Parent that reveals its children one after another. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};
