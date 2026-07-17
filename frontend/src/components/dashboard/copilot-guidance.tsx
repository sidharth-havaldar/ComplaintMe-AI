"use client";

import { motion } from "framer-motion";
import {
  Check,
  FileImage,
  Mail,
  MonitorSmartphone,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import { fadeUp, staggerContainer } from "@/components/dashboard/motion";

const HELPFUL_TIPS = [
  "Include dates",
  "Mention the company",
  "Mention the product",
  "Explain what happened",
];

const EVIDENCE_TYPES = [
  { icon: ReceiptText, label: "Invoice" },
  { icon: FileImage, label: "Photos" },
  { icon: Mail, label: "Emails" },
  { icon: MonitorSmartphone, label: "Screenshots" },
  { icon: ShieldCheck, label: "Warranty" },
];

/**
 * Guidance shown below the copilot composer (COP-001): what to include in a
 * description and which evidence strengthens a complaint. Purely
 * presentational — evidence upload itself remains out of scope.
 */
export function CopilotGuidance() {
  return (
    <motion.div
      variants={staggerContainer}
      className="grid grid-cols-1 gap-5 lg:grid-cols-2"
    >
      {/* Helpful tips */}
      <motion.section
        variants={fadeUp}
        aria-labelledby="tips-heading"
        className="border-border/70 bg-card/70 rounded-2xl border p-6 shadow-lg shadow-black/[0.03] backdrop-blur-xl dark:shadow-black/20"
      >
        <h2 id="tips-heading" className="font-heading text-sm font-semibold tracking-tight">
          Helpful tips
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          The more context you share, the stronger your complaint becomes.
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {HELPFUL_TIPS.map((tip) => (
            <li key={tip} className="flex items-center gap-2.5 text-sm">
              <span className="bg-success/10 text-success flex size-5 shrink-0 items-center justify-center rounded-full">
                <Check aria-hidden="true" className="size-3" />
              </span>
              <span className="text-foreground/90">{tip}</span>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Evidence guidance */}
      <motion.section
        variants={fadeUp}
        aria-labelledby="evidence-heading"
        className="border-border/70 bg-card/70 rounded-2xl border p-6 shadow-lg shadow-black/[0.03] backdrop-blur-xl dark:shadow-black/20"
      >
        <h2 id="evidence-heading" className="font-heading text-sm font-semibold tracking-tight">
          Evidence that helps
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Keep these handy — they make your case much harder to dismiss.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {EVIDENCE_TYPES.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="border-brand/20 bg-brand/10 text-brand dark:bg-brand/15 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
            >
              <Icon aria-hidden="true" className="size-3.5" />
              {label}
            </li>
          ))}
        </ul>
      </motion.section>
    </motion.div>
  );
}
