"use client";

import * as React from "react";
import Link from "next/link";
import { motion, MotionConfig, type Variants } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  FileText,
  Lightbulb,
  LineChart,
  MessageSquareText,
  Paperclip,
  Radar,
  ScanSearch,
  Sparkles,
} from "lucide-react";

import { LogoMark, Wordmark } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Fade in while gently rising into place. */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

/** Parent that reveals its children one after another. */
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/** Section wrapper that reveals its content on scroll. */
function Reveal({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
      <motion.div variants={fadeUp}>
        <Badge variant="brand">{eyebrow}</Badge>
      </motion.div>
      <motion.h2
        variants={fadeUp}
        className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl"
      >
        {title}
      </motion.h2>
      <motion.p variants={fadeUp} className="text-muted-foreground text-base text-balance sm:text-lg">
        {description}
      </motion.p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="group bg-card ring-border relative flex flex-col gap-4 rounded-2xl p-6 shadow-lg shadow-black/[0.03] ring-1 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:shadow-black/20"
    >
      <div className="bg-brand/10 text-brand flex size-11 items-center justify-center rounded-xl transition-transform duration-300 ease-out group-hover:scale-110">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-heading text-base font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

const CONSUMER_FEATURES = [
  {
    icon: MessageSquareText,
    title: "AI Complaint Copilot",
    description:
      "Describe what happened in your own words. Your copilot understands the situation and guides you to the strongest possible complaint.",
  },
  {
    icon: FileText,
    title: "Professional complaint drafting",
    description:
      "Turn frustration into a clear, professional, well-structured complaint that organizations take seriously.",
  },
  {
    icon: Radar,
    title: "Complaint tracking",
    description:
      "Follow every complaint from submission to resolution with a clear status at every step of the journey.",
  },
  {
    icon: Paperclip,
    title: "Evidence guidance",
    description:
      "Know exactly which receipts, photos, and records strengthen your case — before you submit.",
  },
];

const CORTEXA_STAGES = [
  {
    step: "01",
    icon: ScanSearch,
    title: "Understanding",
    description:
      "Cortexa reads every complaint the way an expert would — grasping the issue, the context, and the severity behind the words.",
  },
  {
    step: "02",
    icon: Lightbulb,
    title: "Decision Intelligence",
    description:
      "Understanding is only the first step. Cortexa answers the question that matters: so what? It recommends the action worth taking.",
  },
  {
    step: "03",
    icon: LineChart,
    title: "Complaint Intelligence",
    description:
      "Across thousands of complaints, Cortexa spots patterns, detects emerging risks, and tells you whether things are getting worse.",
  },
];

const ORGANIZATION_FEATURES = [
  {
    icon: BarChart3,
    title: "Executive Dashboards",
    description:
      "A live, decision-ready view of every complaint stream — built for leaders, not analysts.",
  },
  {
    icon: Radar,
    title: "Trend Detection",
    description:
      "Surface emerging issues before they become crises. Know what's rising, where, and why.",
  },
  {
    icon: Brain,
    title: "Decision Support",
    description:
      "Every insight arrives with a recommended action, so teams spend time acting — not interpreting.",
  },
  {
    icon: Building2,
    title: "Business Intelligence",
    description:
      "Transform your complaint channel from a cost center into a source of competitive intelligence.",
  },
];

export function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-background relative min-h-svh overflow-x-clip">
        {/* Header */}
        <header className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" aria-label="ComplaintMe AI home">
              <Wordmark />
            </Link>
            <nav className="flex items-center gap-2">
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild variant="brand">
                <Link href="/register">Get started</Link>
              </Button>
            </nav>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section className="bg-ambient relative overflow-hidden">
            {/* Decorative top glow — purely presentational */}
            <div
              aria-hidden="true"
              className="bg-brand/10 pointer-events-none absolute -top-48 left-1/2 size-[44rem] -translate-x-1/2 rounded-full blur-3xl"
            />
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-4 pt-24 pb-28 text-center sm:px-6 sm:pt-32 sm:pb-36"
            >
              <motion.div variants={fadeUp}>
                <Badge variant="brand">
                  <Sparkles aria-hidden="true" />
                  Powered by Cortexa Intelligence
                </Badge>
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="font-heading text-5xl leading-[1.05] font-semibold tracking-tighter text-balance sm:text-6xl md:text-7xl"
              >
                Turn your problem{" "}
                <span className="from-brand bg-gradient-to-r to-[color-mix(in_oklch,var(--brand),var(--foreground)_35%)] bg-clip-text text-transparent">
                  into action.
                </span>
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="text-muted-foreground max-w-2xl text-lg text-balance sm:text-xl"
              >
                ComplaintMe AI helps consumers create professional complaints and helps
                organizations transform complaints into business intelligence.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 sm:flex-row">
                <Button asChild variant="brand" size="lg" className="h-12 px-7 text-base">
                  <Link href="/register">
                    Start Your Complaint
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-7 text-base">
                  <Link href="#organizations">For Organizations</Link>
                </Button>
              </motion.div>
            </motion.div>
          </section>

          {/* Section 1 — For Consumers */}
          <section id="consumers" className="scroll-mt-16 py-24 sm:py-32">
            <Reveal className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 sm:px-6">
              <SectionHeading
                eyebrow="For Consumers"
                title="Your voice, professionally amplified"
                description="From the first frustrated thought to a resolved complaint — with an AI copilot at your side the entire way."
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {CONSUMER_FEATURES.map((feature) => (
                  <FeatureCard key={feature.title} {...feature} />
                ))}
              </div>
            </Reveal>
          </section>

          {/* Section 2 — Meet Cortexa */}
          <section id="cortexa" className="relative scroll-mt-16 overflow-hidden py-24 sm:py-32">
            {/* Ambient brand wash behind the intelligence story */}
            <div
              aria-hidden="true"
              className="bg-brand/6 pointer-events-none absolute top-1/2 left-1/2 size-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            />
            <Reveal className="relative mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 sm:px-6">
              <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
                <motion.div variants={fadeUp}>
                  <LogoMark className="size-12 rounded-2xl [&>svg]:size-6" />
                </motion.div>
                <motion.h2
                  variants={fadeUp}
                  className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl"
                >
                  Meet Cortexa
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  className="text-muted-foreground text-base text-balance sm:text-lg"
                >
                  The intelligence engine behind ComplaintMe AI. Cortexa doesn&apos;t just read
                  complaints — it turns them into decisions.
                </motion.p>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {CORTEXA_STAGES.map((stage) => (
                  <motion.div
                    key={stage.title}
                    variants={fadeUp}
                    className="bg-card/80 ring-border relative flex flex-col gap-5 rounded-2xl p-7 shadow-lg shadow-black/[0.03] ring-1 backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:shadow-black/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="bg-brand/10 text-brand flex size-11 items-center justify-center rounded-xl">
                        <stage.icon aria-hidden="true" className="size-5" />
                      </div>
                      <span className="text-brand/40 font-heading text-3xl font-semibold tracking-tight">
                        {stage.step}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-heading text-lg font-semibold tracking-tight">
                        {stage.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {stage.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </section>

          {/* Section 3 — For Organizations */}
          <section id="organizations" className="scroll-mt-16 py-24 sm:py-32">
            <Reveal className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 sm:px-6">
              <SectionHeading
                eyebrow="For Organizations"
                title="Every complaint is intelligence"
                description="Stop reading tickets. Start seeing patterns, risks, and the decisions your complaint data has been trying to tell you about."
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {ORGANIZATION_FEATURES.map((feature) => (
                  <FeatureCard key={feature.title} {...feature} />
                ))}
              </div>
            </Reveal>
          </section>

          {/* Final CTA */}
          <section className="pb-24 sm:pb-32">
            <Reveal className="mx-auto w-full max-w-6xl px-4 sm:px-6">
              <motion.div
                variants={fadeUp}
                className="bg-ambient ring-border relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl px-6 py-16 text-center shadow-lg shadow-black/[0.03] ring-1 sm:py-20 dark:shadow-black/20"
              >
                <div
                  aria-hidden="true"
                  className="bg-brand/10 pointer-events-none absolute -top-32 left-1/2 size-[32rem] -translate-x-1/2 rounded-full blur-3xl"
                />
                <h2 className="font-heading relative text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  Ready to be heard?
                </h2>
                <p className="text-muted-foreground relative max-w-xl text-balance sm:text-lg">
                  Tell us what happened. We&apos;ll understand the rest.
                </p>
                <div className="relative flex flex-col items-center gap-3 sm:flex-row">
                  <Button asChild variant="brand" size="lg" className="h-12 px-7 text-base">
                    <Link href="/register">
                      Start Your Complaint
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg" className="h-12 px-7 text-base">
                    <Link href="/login">Sign in</Link>
                  </Button>
                </div>
              </motion.div>
            </Reveal>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-border/60 border-t">
          <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:px-6">
            <Wordmark className="[&>span:last-child]:text-base" />
            <p>© {new Date().getFullYear()} ComplaintMe AI. Turn your problem into action.</p>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
