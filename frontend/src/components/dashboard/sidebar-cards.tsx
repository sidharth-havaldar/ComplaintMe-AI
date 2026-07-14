"use client";

import { motion } from "framer-motion";
import { Check, ShieldCheck, Sparkles } from "lucide-react";

import { fadeUp } from "@/components/dashboard/motion";
import { cn } from "@/lib/utils";

/** The capabilities Cortexa infers from a raw complaint description. */
const CORTEXA_UNDERSTANDS: { label: string; soon?: boolean }[] = [
  { label: "Company" },
  { label: "Product" },
  { label: "Category" },
  { label: "Sentiment" },
  { label: "Severity" },
  { label: "Priority" },
  { label: "Summary" },
  { label: "Root Cause", soon: true },
];

const NO_FRICTION = ["No forms", "No categories", "No dropdowns", "Just describe your issue"];

/**
 * The right rail of the AI workspace: three calm, informative cards that answer
 * "why is this different?" and "what will the AI do with what I write?". Purely
 * presentational — no data, no side effects.
 */
export function SidebarCards() {
  return (
    <div className="flex flex-col gap-5">
      <GlassCard>
        <CardEyebrow icon={Sparkles}>Why ComplaintMe AI?</CardEyebrow>
        <ul className="mt-4 flex flex-col gap-2.5">
          {NO_FRICTION.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                <Check aria-hidden="true" className="size-3" />
              </span>
              <span className="text-foreground/90">{item}</span>
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard>
        <CardEyebrow icon={Sparkles}>Cortexa understands</CardEyebrow>
        <ul className="mt-4 flex flex-wrap gap-2">
          {CORTEXA_UNDERSTANDS.map((item) => (
            <li
              key={item.label}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                item.soon
                  ? "border-border/60 bg-muted/50 text-muted-foreground"
                  : "border-brand/20 bg-brand/10 text-brand dark:bg-brand/15"
              )}
            >
              {item.label}
              {item.soon && <span className="text-muted-foreground/70">· Soon</span>}
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard className="bg-gradient-to-b from-card/70 to-brand/[0.04]">
        <CardEyebrow icon={ShieldCheck}>Privacy</CardEyebrow>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your complaint is encrypted. Cortexa processes only what is required to understand and
          route your issue — nothing more.
        </p>
      </GlassCard>
    </div>
  );
}

/** A small labeled header with a brand-tinted icon chip. */
function CardEyebrow({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-brand/15 bg-brand/10 text-brand">
        <Icon aria-hidden={true} className="size-4" />
      </span>
      <h2 className="font-heading text-sm font-semibold tracking-tight">{children}</h2>
    </div>
  );
}

/** Shared glass surface for sidebar cards, animated with the workspace stagger. */
function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={fadeUp}
      className={cn(
        "rounded-2xl border border-border/70 bg-card/70 p-5 shadow-lg shadow-black/[0.03] backdrop-blur-xl dark:shadow-black/20",
        className
      )}
    >
      {children}
    </motion.section>
  );
}
