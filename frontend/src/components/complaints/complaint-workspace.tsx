"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Boxes,
  BrainCircuit,
  Briefcase,
  Building,
  Building2,
  Check,
  Circle,
  ClipboardList,
  Clock,
  Compass,
  Copy,
  FileText,
  Flag,
  Flame,
  Gauge,
  Heart,
  HelpCircle,
  History,
  Languages,
  Layers,
  Lightbulb,
  LineChart,
  Loader2,
  MoveRight,
  Package,
  ScanSearch,
  Share2,
  ShieldAlert,
  Sparkles,
  Tag,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { fadeUp, staggerContainer } from "@/components/dashboard/motion";
import { LogoMark, Wordmark } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ComplaintNotFoundError,
  getComplaint,
  type Complaint,
  type ComplaintAIAnalysis,
  type ComplaintIntelligence,
  type DecisionIntelligence,
} from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * UI-004 — the Cortexa Intelligence Workspace.
 *
 * The complaint detail surface. It reads a single complaint through the existing
 * read-only GET /complaints/{id} endpoint (via {@link getComplaint}) and frames
 * it as a premium "AI has finished reasoning" workspace: the original complaint
 * on the left, Cortexa's structured analysis on the right, an animated pipeline
 * timeline, and a preview of upcoming intelligence.
 *
 * Presentation only. There are NO backend, API, auth, routing or business-logic
 * changes here. The AI analysis fields have no backend source yet, so they are
 * rendered as elegant "Waiting for AI analysis…" placeholders rather than empty
 * cards — the layout is ready for real data the moment the model produces it.
 */

type LoadState = "loading" | "ready" | "notfound" | "error";

/** Where the complaint sits in the (future) analysis pipeline. */
type AnalysisPhase = "pending" | "analyzing" | "completed";

export function ComplaintWorkspace({ id }: { id: string }) {
  const [state, setState] = React.useState<LoadState>("loading");
  const [complaint, setComplaint] = React.useState<Complaint | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setState("loading");

    getComplaint(id)
      .then((data) => {
        if (cancelled) return;
        setComplaint(data);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState(error instanceof ComplaintNotFoundError ? "notfound" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Cortexa analysis runs in the background after submission, so the first load
  // may arrive before it completes. Poll a few times until the analysis lands,
  // then stop. Transient errors are ignored — the loaded complaint still shows.
  React.useEffect(() => {
    if (state !== "ready" || !complaint || complaint.ai_analysis) return;

    let cancelled = false;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const fresh = await getComplaint(id);
        if (!cancelled && fresh.ai_analysis) {
          setComplaint(fresh);
          clearInterval(interval);
        }
      } catch {
        // Ignore polling hiccups; we simply try again next tick.
      }
      if (attempts >= 20) clearInterval(interval);
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [state, complaint, id]);

  return (
    <MotionConfig reducedMotion="user">
      <main className="bg-background bg-ambient relative min-h-svh">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col px-5 pb-24 sm:px-8">
          {/* Slim top bar: brand home + return path. */}
          <header className="flex items-center justify-between py-5">
            <Link
              href="/dashboard"
              aria-label="ComplaintMe AI — back to dashboard"
              className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <Wordmark />
            </Link>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft aria-hidden="true" className="size-4" />
                Dashboard
              </Link>
            </Button>
          </header>

          {state === "loading" && <WorkspaceSkeleton />}
          {state === "notfound" && <NotFoundState />}
          {state === "error" && <ErrorState />}
          {state === "ready" && complaint && <IntelligenceView complaint={complaint} />}
        </div>
      </main>
    </MotionConfig>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main view                                                                 */
/* -------------------------------------------------------------------------- */

function IntelligenceView({ complaint }: { complaint: Complaint }) {
  const analysis = complaint.ai_analysis ?? null;
  const phase: AnalysisPhase = analysis ? "completed" : "analyzing";

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-10 pt-4 sm:pt-8"
    >
      <PageHeader phase={phase} />

      {/* Original complaint (left) + Cortexa analysis (right). */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8">
        <OriginalComplaintCard complaint={complaint} analysis={analysis} />
        <CortexaAnalysisCard phase={phase} analysis={analysis} />
      </div>

      <DecisionIntelligenceSection decision={analysis?.decision_intelligence ?? null} />

      <ComplaintIntelligenceSection intelligence={analysis?.complaint_intelligence ?? null} />

      <AnalysisTimeline phase={phase} />

      <FutureInsights />
    </motion.div>
  );
}

function PageHeader({ phase }: { phase: AnalysisPhase }) {
  return (
    <motion.div variants={fadeUp} className="flex flex-col gap-4">
      <div className="text-muted-foreground flex items-center gap-2.5 text-sm font-medium">
        <LogoMark className="size-6 rounded-lg [&_svg]:size-3.5" />
        <span>
          Generated by <span className="text-brand">Cortexa</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          Complaint Intelligence
        </h1>
        <StatusBadge phase={phase} />
      </div>
      <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
        A structured, executive-ready view of this complaint — the original report alongside
        Cortexa’s understanding of who, what and how urgent.
      </p>
    </motion.div>
  );
}

/** Animated status pill: Pending / Analyzing / Completed. */
function StatusBadge({ phase }: { phase: AnalysisPhase }) {
  const config = {
    pending: { label: "Pending", variant: "muted" as const, dot: "bg-muted-foreground" },
    analyzing: { label: "Analyzing", variant: "brand" as const, dot: "bg-brand" },
    completed: { label: "Completed", variant: "success" as const, dot: "bg-success" },
  }[phase];

  return (
    <Badge variant={config.variant} className="gap-2 px-3 py-1 text-sm" aria-live="polite">
      <span className="relative flex size-2" aria-hidden="true">
        {phase !== "completed" && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-60",
              phase === "analyzing" && "animate-ping motion-reduce:animate-none",
              config.dot
            )}
          />
        )}
        <span className={cn("relative inline-flex size-2 rounded-full", config.dot)} />
      </span>
      {config.label}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*  Left column — original complaint                                          */
/* -------------------------------------------------------------------------- */

function OriginalComplaintCard({
  complaint,
  analysis,
}: {
  complaint: Complaint;
  analysis: ComplaintAIAnalysis | null;
}) {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(complaint.description);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (e.g. insecure context); fail silently.
    }
  }

  return (
    <motion.section
      variants={fadeUp}
      aria-labelledby="original-heading"
      className="border-border/70 bg-card/70 flex flex-col gap-5 rounded-3xl border p-6 shadow-lg shadow-black/[0.03] backdrop-blur-xl sm:p-7 dark:shadow-black/20"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="border-border/70 bg-muted/50 text-foreground/70 flex size-8 shrink-0 items-center justify-center rounded-xl border">
            <FileText aria-hidden="true" className="size-4" />
          </span>
          <h2 id="original-heading" className="font-heading text-base font-semibold tracking-tight">
            Original Complaint
          </h2>
        </div>
        <time
          dateTime={complaint.created_at}
          className="text-muted-foreground text-xs tabular-nums"
        >
          {formatDateTime(complaint.created_at)}
        </time>
      </div>

      {/* The complaint itself — the source of truth. */}
      <blockquote className="border-brand/30 text-foreground/90 border-l-2 pl-4 text-[0.95rem] leading-relaxed whitespace-pre-wrap">
        {complaint.title?.trim() && (
          <span className="text-foreground mb-1 block font-medium">{complaint.title}</span>
        )}
        {complaint.description}
      </blockquote>

      {/* Metadata grid. */}
      <dl className="border-border/60 grid grid-cols-2 gap-x-4 gap-y-4 border-t pt-5 text-sm">
        <MetaItem label="Complaint ID" value={`#${complaint.id.slice(0, 8).toUpperCase()}`} mono />
        <MetaItem label="Submitted" value={formatDate(complaint.created_at)} />
        <MetaItem
          label="Company"
          value={analysis ? (analysis.company ?? "—") : undefined}
          placeholder={!analysis}
        />
        <MetaItem
          label="Product"
          value={analysis ? (analysis.product ?? "—") : undefined}
          placeholder={!analysis}
        />
      </dl>

      {/* Actions. */}
      <div className="border-border/60 flex flex-wrap items-center gap-2 border-t pt-5">
        <Button variant="outline" size="sm" onClick={handleCopy} aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="text-success inline-flex items-center gap-1.5"
              >
                <Check aria-hidden="true" className="size-3.5" />
                Copied
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="inline-flex items-center gap-1.5"
              >
                <Copy aria-hidden="true" className="size-3.5" />
                Copy
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        <button
          type="button"
          disabled
          aria-label="Share (coming soon)"
          className="border-border/70 bg-muted/40 text-muted-foreground inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.8rem] font-medium"
        >
          <Share2 aria-hidden="true" className="size-3.5" />
          Share
          <span className="text-muted-foreground/60">· Soon</span>
        </button>
      </div>
    </motion.section>
  );
}

/** One entry in the complaint metadata grid. */
function MetaItem({
  label,
  value,
  placeholder = false,
  mono = false,
}: {
  label: string;
  value?: string;
  placeholder?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className={cn("text-foreground/90 text-sm", mono && "font-mono tabular-nums")}>
        {placeholder ? <WaitingValue compact /> : value}
      </dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Right column — Cortexa analysis                                           */
/* -------------------------------------------------------------------------- */

/** Scalar attributes Cortexa infers, shown as a two-column grid. */
const ANALYSIS_FIELDS: { icon: IconType; label: string; key: keyof ComplaintAIAnalysis }[] = [
  { icon: Building2, label: "Company", key: "company" },
  { icon: Package, label: "Product", key: "product" },
  { icon: Tag, label: "Category", key: "category" },
  { icon: Users, label: "Department", key: "department" },
  { icon: Gauge, label: "Sentiment", key: "sentiment" },
  { icon: Heart, label: "Emotion", key: "emotion" },
  { icon: Flame, label: "Severity", key: "severity" },
  { icon: Flag, label: "Priority", key: "priority" },
  { icon: Languages, label: "Language", key: "language" },
];

function CortexaAnalysisCard({
  phase,
  analysis,
}: {
  phase: AnalysisPhase;
  analysis: ComplaintAIAnalysis | null;
}) {
  const confidence =
    analysis?.confidence_score != null ? Math.round(analysis.confidence_score * 100) : null;

  return (
    <motion.section
      variants={fadeUp}
      aria-labelledby="analysis-heading"
      className="relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-b from-card/80 to-brand/[0.04] p-6 shadow-xl shadow-brand/5 backdrop-blur-xl sm:p-7 dark:from-card/70 dark:shadow-black/20"
    >
      {/* Ambient brand glow behind the AI card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(28rem_18rem_at_100%_0%,color-mix(in_oklch,var(--brand)_12%,transparent),transparent_70%)]"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <LogoMark className="size-10 rounded-2xl [&_svg]:size-5" />
          <div className="flex flex-col">
            <h2
              id="analysis-heading"
              className="font-heading text-base font-semibold tracking-tight"
            >
              Cortexa Analysis
            </h2>
            <p className="text-muted-foreground text-xs">Structured intelligence</p>
          </div>
        </div>
        <StatusBadge phase={phase} />
      </div>

      {/* State banner — never an empty card. */}
      <div className="border-brand/15 bg-brand/[0.04] text-muted-foreground flex items-center gap-2.5 rounded-2xl border border-dashed px-4 py-3 text-sm">
        <Sparkles aria-hidden="true" className="text-brand size-4 shrink-0" />
        <span>
          {analysis
            ? "Cortexa has finished analyzing this complaint."
            : "Cortexa is analyzing this complaint..."}
        </span>
      </div>

      {/* Scalar attributes. */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        {ANALYSIS_FIELDS.map((field) => (
          <AnalysisField
            key={field.label}
            icon={field.icon}
            label={field.label}
            value={analysis ? ((analysis[field.key] as string | null) ?? "—") : null}
          />
        ))}
      </div>

      {/* Entities. */}
      <div className="border-border/50 flex flex-col gap-2 border-t pt-5">
        <FieldLabel icon={Boxes} label="Entities" />
        {analysis ? (
          analysis.named_entities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.named_entities.map((entity) => (
                <span
                  key={entity}
                  className="border-brand/20 bg-brand/10 text-brand dark:bg-brand/15 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
                >
                  {entity}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">No named entities detected.</span>
          )
        ) : (
          <>
            <div className="flex flex-wrap gap-2" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="border-border/60 bg-muted/40 h-6 rounded-full border"
                  style={{ width: `${5 + i * 1.5}rem` }}
                />
              ))}
            </div>
            <WaitingValue compact />
          </>
        )}
      </div>

      {/* Summary. */}
      <div className="border-border/50 flex flex-col gap-2.5 border-t pt-5">
        <FieldLabel icon={FileText} label="Executive Summary" />
        {analysis ? (
          <p className="text-foreground/90 text-sm leading-relaxed">
            {analysis.summary ?? "No summary available."}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2" aria-hidden="true">
              <span className="bg-muted/50 block h-3 w-full rounded-full" />
              <span className="bg-muted/50 block h-3 w-[92%] rounded-full" />
              <span className="bg-muted/50 block h-3 w-[70%] rounded-full" />
            </div>
            <WaitingValue />
          </>
        )}
      </div>

      {/* Confidence meter. */}
      <div className="border-border/50 flex flex-col gap-2.5 border-t pt-5">
        <div className="flex items-center justify-between">
          <FieldLabel icon={BadgeCheck} label="Confidence" />
          <span
            className={cn(
              "text-xs tabular-nums",
              confidence != null ? "text-brand font-semibold" : "text-muted-foreground/70 italic"
            )}
          >
            {confidence != null ? `${confidence}%` : "Pending"}
          </span>
        </div>
        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full" aria-hidden="true">
          <motion.div
            className="from-brand h-full rounded-full bg-gradient-to-r to-[color-mix(in_oklch,var(--brand),white_25%)]"
            initial={{ width: "0%" }}
            animate={{ width: confidence != null ? `${confidence}%` : "0%" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </motion.section>
  );
}

/** A single Cortexa attribute (icon chip + label + value or waiting placeholder). */
function AnalysisField({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType;
  label: string;
  value: string | null;
}) {
  return (
    <div className="border-border/50 bg-card/40 flex items-center gap-3 rounded-2xl border p-3">
      <span className="border-brand/15 bg-brand/10 text-brand flex size-9 shrink-0 items-center justify-center rounded-xl border">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        {value != null ? (
          <span className="text-foreground truncate text-sm font-medium">{value}</span>
        ) : (
          <WaitingValue compact />
        )}
      </div>
    </div>
  );
}

/** Small labeled header used inside the analysis card. */
function FieldLabel({ icon: Icon, label }: { icon: IconType; label: string }) {
  return (
    <span className="text-foreground/80 flex items-center gap-2 text-sm font-medium">
      <Icon aria-hidden="true" className="text-muted-foreground size-4" />
      {label}
    </span>
  );
}

/** Elegant "waiting for the model" placeholder — never an empty field. */
function WaitingValue({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={cn(
        "text-muted-foreground/70 inline-flex items-center gap-1.5 italic",
        compact ? "text-xs" : "text-sm"
      )}
    >
      <span className="relative flex size-1.5 shrink-0" aria-hidden="true">
        <span className="bg-brand/50 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:animate-none" />
        <span className="bg-brand/60 relative inline-flex size-1.5 rounded-full" />
      </span>
      Waiting for AI analysis…
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Decision intelligence (AI-002) — "so what should the business do next?"   */
/* -------------------------------------------------------------------------- */

/** Actionability level → meter fill (of 4) and tone. */
const ACTIONABILITY_META: Record<string, { step: number; tone: "muted" | "brand" | "success" }> = {
  Low: { step: 1, tone: "muted" },
  Medium: { step: 2, tone: "brand" },
  High: { step: 3, tone: "brand" },
  "Very High": { step: 4, tone: "success" },
};

function DecisionIntelligenceSection({ decision }: { decision: DecisionIntelligence | null }) {
  return (
    <motion.section
      variants={fadeUp}
      aria-labelledby="decision-heading"
      className="flex flex-col gap-5"
    >
      <div className="flex items-center gap-2.5">
        <span className="border-brand/15 bg-brand/10 text-brand flex size-8 shrink-0 items-center justify-center rounded-xl border">
          <Compass aria-hidden="true" className="size-4" />
        </span>
        <div className="flex flex-col">
          <h2 id="decision-heading" className="font-heading text-lg font-semibold tracking-tight">
            Decision Intelligence
          </h2>
          <p className="text-muted-foreground text-sm">So what should the business do next?</p>
        </div>
      </div>

      {decision ? (
        <div className="flex flex-col gap-6">
          <ExecutiveSummaryCard summary={decision.executive_summary} />
          <div className="grid gap-6 lg:grid-cols-2">
            <BusinessImpactCard impact={decision.business_impact} />
            <RecommendedActionsCard actions={decision.recommended_actions} />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1.5fr]">
            <RecommendedDepartmentCard department={decision.recommended_department} />
            <ActionabilityCard level={decision.actionability} />
            <ReasoningCard reasoning={decision.reasoning} />
          </div>
        </div>
      ) : (
        <div className="border-brand/15 bg-brand/[0.04] text-muted-foreground flex items-center gap-2.5 rounded-2xl border border-dashed px-5 py-6 text-sm">
          <Sparkles aria-hidden="true" className="text-brand size-4 shrink-0" />
          <span>Cortexa is generating decision intelligence for this complaint...</span>
        </div>
      )}
    </motion.section>
  );
}

/** Shared glass surface + labelled header for the decision cards. */
function DecisionCard({
  icon: Icon,
  title,
  className,
  children,
}: {
  icon: IconType;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        "border-border/70 bg-card/70 flex flex-col gap-3 rounded-2xl border p-5 shadow-lg shadow-black/[0.03] backdrop-blur-xl dark:shadow-black/20",
        className
      )}
    >
      <FieldLabel icon={Icon} label={title} />
      {children}
    </motion.div>
  );
}

function ExecutiveSummaryCard({ summary }: { summary: string | null }) {
  return (
    <motion.div
      variants={fadeUp}
      className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-b from-card/80 to-brand/[0.04] p-6 shadow-lg shadow-brand/5 backdrop-blur-xl dark:from-card/70 dark:shadow-black/20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(26rem_14rem_at_0%_0%,color-mix(in_oklch,var(--brand)_10%,transparent),transparent_70%)]"
      />
      <FieldLabel icon={FileText} label="Executive Summary" />
      <p className="text-foreground/90 mt-3 text-[0.95rem] leading-relaxed text-pretty">
        {summary ?? "No executive summary available."}
      </p>
    </motion.div>
  );
}

function BusinessImpactCard({ impact }: { impact: string[] }) {
  return (
    <DecisionCard icon={AlertTriangle} title="Business Impact">
      {impact.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {impact.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <span className="bg-brand/50 mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
              <span className="text-foreground/90">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">No business impact assessed.</p>
      )}
    </DecisionCard>
  );
}

function RecommendedActionsCard({ actions }: { actions: string[] }) {
  return (
    <DecisionCard icon={ClipboardList} title="Recommended Actions">
      {actions.length > 0 ? (
        <ol className="flex flex-col gap-2.5">
          {actions.map((action, i) => (
            <li key={action} className="flex items-start gap-3 text-sm leading-relaxed">
              <span className="border-brand/20 bg-brand/10 text-brand mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums">
                {i + 1}
              </span>
              <span className="text-foreground/90">{action}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground text-sm">No recommended actions.</p>
      )}
    </DecisionCard>
  );
}

function RecommendedDepartmentCard({
  department,
}: {
  department: DecisionIntelligence["recommended_department"];
}) {
  const rows: { label: string; value: string | null }[] = [
    { label: "Primary", value: department?.primary ?? null },
    { label: "Secondary", value: department?.secondary ?? null },
    { label: "Optional", value: department?.optional ?? null },
  ];
  return (
    <DecisionCard icon={Building} title="Recommended Department">
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-xs font-medium">{row.label}</span>
            {row.value ? (
              <span
                className={cn(
                  "truncate text-sm font-medium",
                  row.label === "Primary" ? "text-brand" : "text-foreground/90"
                )}
              >
                {row.value}
              </span>
            ) : (
              <span className="text-muted-foreground/60 text-sm">—</span>
            )}
          </li>
        ))}
      </ul>
    </DecisionCard>
  );
}

function ActionabilityCard({ level }: { level: string | null }) {
  const meta = (level && ACTIONABILITY_META[level]) || ACTIONABILITY_META.Low;
  const toneClass =
    meta.tone === "success"
      ? "border-success/25 bg-success/10 text-success"
      : meta.tone === "brand"
        ? "border-brand/20 bg-brand/10 text-brand"
        : "border-border bg-muted text-muted-foreground";
  const fillClass =
    meta.tone === "success" ? "bg-success" : meta.tone === "brand" ? "bg-brand" : "bg-muted-foreground";

  return (
    <DecisionCard icon={Target} title="Actionability">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">How immediately actionable</span>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            toneClass
          )}
        >
          {level ?? "Low"}
        </span>
      </div>
      <div className="mt-1 flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((segment) => (
          <motion.span
            key={segment}
            initial={{ opacity: 0.4, scaleY: 0.6 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.3, delay: 0.05 * segment }}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              segment <= meta.step ? fillClass : "bg-muted"
            )}
          />
        ))}
      </div>
    </DecisionCard>
  );
}

function ReasoningCard({ reasoning }: { reasoning: string | null }) {
  return (
    <DecisionCard icon={BrainCircuit} title="Decision Reasoning">
      <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
        {reasoning ?? "No reasoning available."}
      </p>
    </DecisionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Complaint intelligence (AI-003) — "has this happened before?"             */
/* -------------------------------------------------------------------------- */

/** Trend value → icon, tone and short narrative. */
const TREND_META: Record<string, { icon: IconType; tone: Tone; caption: string }> = {
  Increasing: { icon: TrendingUp, tone: "destructive", caption: "Complaint volume is rising." },
  Stable: { icon: MoveRight, tone: "brand", caption: "Complaint volume is holding steady." },
  Decreasing: { icon: TrendingDown, tone: "success", caption: "Complaint volume is easing." },
  Unknown: { icon: HelpCircle, tone: "muted", caption: "Not enough history to detect a trend." },
};

/** Risk level → severity step (of 4) and tone. */
const RISK_META: Record<string, { step: number; tone: Tone }> = {
  Low: { step: 1, tone: "success" },
  Medium: { step: 2, tone: "brand" },
  High: { step: 3, tone: "destructive" },
  Critical: { step: 4, tone: "destructive" },
};

type Tone = "muted" | "brand" | "success" | "destructive";

const TONE_CHIP: Record<Tone, string> = {
  muted: "border-border bg-muted text-muted-foreground",
  brand: "border-brand/20 bg-brand/10 text-brand",
  success: "border-success/25 bg-success/10 text-success",
  destructive: "border-destructive/25 bg-destructive/10 text-destructive",
};

const TONE_FILL: Record<Tone, string> = {
  muted: "bg-muted-foreground",
  brand: "bg-brand",
  success: "bg-success",
  destructive: "bg-destructive",
};

const TONE_TEXT: Record<Tone, string> = {
  muted: "text-muted-foreground",
  brand: "text-brand",
  success: "text-success",
  destructive: "text-destructive",
};

function ComplaintIntelligenceSection({
  intelligence,
}: {
  intelligence: ComplaintIntelligence | null;
}) {
  return (
    <motion.section
      variants={fadeUp}
      aria-labelledby="intelligence-heading"
      className="flex flex-col gap-5"
    >
      <div className="flex items-center gap-2.5">
        <span className="border-brand/15 bg-brand/10 text-brand flex size-8 shrink-0 items-center justify-center rounded-xl border">
          <History aria-hidden="true" className="size-4" />
        </span>
        <div className="flex flex-col">
          <h2
            id="intelligence-heading"
            className="font-heading text-lg font-semibold tracking-tight"
          >
            Complaint Intelligence
          </h2>
          <p className="text-muted-foreground text-sm">Has this happened before?</p>
        </div>
      </div>

      {intelligence ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <SimilarComplaintsCard
              count={intelligence.similar_count}
              confidence={intelligence.similarity_confidence}
            />
            <TrendCard trend={intelligence.trend} />
            <RiskCard level={intelligence.risk_level} />
          </div>
          <ExecutiveInsightCard
            pattern={intelligence.pattern}
            insight={intelligence.executive_insight}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <BusinessRecommendationCard recommendations={intelligence.business_recommendation} />
            <HealthScoreCard
              score={intelligence.health_score}
              reasons={intelligence.health_reasons}
            />
          </div>
        </div>
      ) : (
        <div className="border-brand/15 bg-brand/[0.04] text-muted-foreground flex items-center gap-2.5 rounded-2xl border border-dashed px-5 py-6 text-sm">
          <Sparkles aria-hidden="true" className="text-brand size-4 shrink-0" />
          <span>Cortexa is checking whether this has happened before...</span>
        </div>
      )}
    </motion.section>
  );
}

/** Similar-complaint count with a similarity-confidence meter beneath it. */
function SimilarComplaintsCard({ count, confidence }: { count: number; confidence: number }) {
  const clamped = Math.max(0, Math.min(100, confidence));
  return (
    <DecisionCard icon={Layers} title="Similar Complaints">
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-brand text-4xl font-semibold tabular-nums">
          {count}
        </span>
        <span className="text-muted-foreground text-sm">
          {count === 1 ? "similar complaint found" : "similar complaints found"}
        </span>
      </div>
      <div className="mt-1 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Similarity confidence</span>
          <span
            className={cn(
              "text-xs font-semibold tabular-nums",
              count > 0 ? "text-brand" : "text-muted-foreground/70"
            )}
          >
            {clamped}%
          </span>
        </div>
        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full" aria-hidden="true">
          <motion.div
            className="from-brand h-full rounded-full bg-gradient-to-r to-[color-mix(in_oklch,var(--brand),white_25%)]"
            initial={{ width: "0%" }}
            animate={{ width: `${clamped}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">
        {count > 0
          ? "Matched by company, product, category and failure mode."
          : "No matching history — this appears to be a first occurrence."}
      </p>
    </DecisionCard>
  );
}

function TrendCard({ trend }: { trend: string | null }) {
  const meta = (trend && TREND_META[trend]) || TREND_META.Unknown;
  const TrendIcon = meta.icon;
  return (
    <DecisionCard icon={Activity} title="Trend">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl border",
            TONE_CHIP[meta.tone]
          )}
        >
          <TrendIcon aria-hidden="true" className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-foreground text-lg font-semibold tracking-tight">
            {trend ?? "Unknown"}
          </span>
          <span className="text-muted-foreground text-xs leading-relaxed">{meta.caption}</span>
        </div>
      </div>
    </DecisionCard>
  );
}

function RiskCard({ level }: { level: string | null }) {
  const meta = (level && RISK_META[level]) || RISK_META.Low;
  return (
    <DecisionCard icon={ShieldAlert} title="Risk Level">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">Business exposure</span>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            TONE_CHIP[meta.tone]
          )}
        >
          {level ?? "Low"}
        </span>
      </div>
      <div className="mt-1 flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((segment) => (
          <motion.span
            key={segment}
            initial={{ opacity: 0.4, scaleY: 0.6 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.3, delay: 0.05 * segment }}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              segment <= meta.step ? TONE_FILL[meta.tone] : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Weighs frequency, severity, actionability and recurrence.
      </p>
    </DecisionCard>
  );
}

/** Pattern + executive insight on the branded glass surface. */
function ExecutiveInsightCard({
  pattern,
  insight,
}: {
  pattern: string | null;
  insight: string | null;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-b from-card/80 to-brand/[0.04] p-6 shadow-lg shadow-brand/5 backdrop-blur-xl dark:from-card/70 dark:shadow-black/20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(26rem_14rem_at_0%_0%,color-mix(in_oklch,var(--brand)_10%,transparent),transparent_70%)]"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FieldLabel icon={Lightbulb} label="Executive Insight" />
        {pattern && (
          <span className="border-brand/20 bg-brand/10 text-brand inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
            <ScanSearch aria-hidden="true" className="size-3.5" />
            {pattern}
          </span>
        )}
      </div>
      <p className="text-foreground/90 mt-3 text-[0.95rem] leading-relaxed text-pretty">
        {insight ?? "No executive insight available."}
      </p>
    </motion.div>
  );
}

function BusinessRecommendationCard({ recommendations }: { recommendations: string[] }) {
  return (
    <DecisionCard icon={Briefcase} title="Business Recommendation">
      {recommendations.length > 0 ? (
        <ol className="flex flex-col gap-2.5">
          {recommendations.map((item, i) => (
            <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
              <span className="border-brand/20 bg-brand/10 text-brand mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums">
                {i + 1}
              </span>
              <span className="text-foreground/90">{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground text-sm">No recommendation required.</p>
      )}
    </DecisionCard>
  );
}

/** Relationship health score (0–100) with the factors that lowered it. */
function HealthScoreCard({ score, reasons }: { score: number | null; reasons: string[] }) {
  const clamped = score != null ? Math.max(0, Math.min(100, score)) : null;
  const tone: Tone =
    clamped == null ? "muted" : clamped >= 75 ? "success" : clamped >= 50 ? "brand" : "destructive";

  return (
    <DecisionCard icon={Heart} title="Relationship Health">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">Customer relationship signal</span>
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            clamped != null ? TONE_TEXT[tone] : "text-muted-foreground/70 italic"
          )}
        >
          {clamped != null ? `${clamped}/100` : "Pending"}
        </span>
      </div>
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full" aria-hidden="true">
        <motion.div
          className={cn("h-full rounded-full", TONE_FILL[tone])}
          initial={{ width: "0%" }}
          animate={{ width: clamped != null ? `${clamped}%` : "0%" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {reasons.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {reasons.map((reason) => (
            <span
              key={reason}
              className="border-border/60 bg-muted/50 text-muted-foreground inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
            >
              {reason}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs leading-relaxed">
          No negative signals detected.
        </p>
      )}
    </DecisionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Timeline                                                                  */
/* -------------------------------------------------------------------------- */

type StepState = "done" | "active" | "upcoming";

function AnalysisTimeline({ phase }: { phase: AnalysisPhase }) {
  const steps: { label: string; description: string; state: StepState }[] = [
    { label: "Complaint Submitted", description: "Your report reached Cortexa.", state: "done" },
    {
      label: "Stored Successfully",
      description: "Encrypted and saved to your workspace.",
      state: "done",
    },
    {
      label: "AI Analysis",
      description:
        phase === "completed"
          ? "Cortexa understood your complaint."
          : "Cortexa will extract structure and intent.",
      state: phase === "completed" ? "done" : "active",
    },
    {
      label: "Recommendations",
      description: "Suggested next steps and resolutions.",
      state: phase === "completed" ? "active" : "upcoming",
    },
    { label: "Resolution", description: "Complaint closed and confirmed.", state: "upcoming" },
  ];

  // Progress fill: fraction of the track up to the last completed node.
  const lastDone = steps.reduce((acc, step, i) => (step.state === "done" ? i : acc), 0);
  const progress = steps.length > 1 ? (lastDone / (steps.length - 1)) * 100 : 0;

  return (
    <motion.section
      variants={fadeUp}
      aria-labelledby="timeline-heading"
      className="border-border/70 bg-card/70 flex flex-col gap-6 rounded-3xl border p-6 shadow-lg shadow-black/[0.03] backdrop-blur-xl sm:p-7 dark:shadow-black/20"
    >
      <div className="flex items-center gap-2.5">
        <span className="border-border/70 bg-muted/50 text-foreground/70 flex size-8 shrink-0 items-center justify-center rounded-xl border">
          <ScanSearch aria-hidden="true" className="size-4" />
        </span>
        <h2 id="timeline-heading" className="font-heading text-base font-semibold tracking-tight">
          Analysis Pipeline
        </h2>
      </div>

      <ol className="relative flex flex-col">
        {/* Track + animated progress fill, behind the nodes. */}
        <span
          aria-hidden="true"
          className="bg-border/70 absolute top-3 bottom-3 left-[15px] w-px"
        />
        <motion.span
          aria-hidden="true"
          className="from-brand absolute top-3 left-[15px] w-px bg-gradient-to-b to-success"
          initial={{ height: 0 }}
          animate={{ height: `calc((100% - 1.5rem) * ${progress / 100})` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />

        {steps.map((step, i) => (
          <motion.li
            key={step.label}
            variants={fadeUp}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            <TimelineNode state={step.state} index={i} />
            <div className="flex flex-col gap-0.5 pt-0.5">
              <span
                className={cn(
                  "text-sm font-medium",
                  step.state === "upcoming" ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {step.label}
              </span>
              <span className="text-muted-foreground text-xs leading-relaxed">
                {step.description}
              </span>
            </div>
          </motion.li>
        ))}
      </ol>
    </motion.section>
  );
}

function TimelineNode({ state, index }: { state: StepState; index: number }) {
  return (
    <span className="relative z-10 flex size-8 shrink-0 items-center justify-center">
      {state === "active" && (
        <motion.span
          aria-hidden="true"
          className="bg-brand/20 absolute inline-flex size-8 rounded-full"
          animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 + index * 0.08 }}
        className={cn(
          "relative flex size-8 items-center justify-center rounded-full border",
          state === "done" && "border-success/30 bg-success/12 text-success",
          state === "active" && "border-brand/40 bg-brand/15 text-brand",
          state === "upcoming" && "border-border bg-muted/60 text-muted-foreground/60"
        )}
      >
        {state === "done" && <Check aria-hidden="true" className="size-4" strokeWidth={3} />}
        {state === "active" && <Clock aria-hidden="true" className="size-4" />}
        {state === "upcoming" && <Circle aria-hidden="true" className="size-2.5 fill-current" />}
      </motion.span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Future insights                                                           */
/* -------------------------------------------------------------------------- */

const FUTURE_INSIGHTS: { icon: IconType; title: string; description: string }[] = [
  {
    icon: ScanSearch,
    title: "Root Cause",
    description: "Trace the underlying issue behind this complaint.",
  },
  {
    icon: Users,
    title: "Customer Journey",
    description: "Follow this customer's history across every touchpoint.",
  },
  {
    icon: LineChart,
    title: "Predictions",
    description: "Forecast escalation and resolution likelihood.",
  },
];

function FutureInsights() {
  return (
    <motion.section
      variants={fadeUp}
      aria-labelledby="insights-heading"
      className="flex flex-col gap-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="insights-heading" className="font-heading text-lg font-semibold tracking-tight">
          Future Insights
        </h2>
        <span className="text-muted-foreground text-sm">Rolling out soon</span>
      </div>

      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FUTURE_INSIGHTS.map((insight) => (
          <InsightCard key={insight.title} {...insight} />
        ))}
      </motion.div>
    </motion.section>
  );
}

function InsightCard({
  icon: Icon,
  title,
  description,
}: {
  icon: IconType;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        "group/insight border-border/70 bg-card/60 relative flex flex-col gap-3 rounded-2xl border p-5 shadow-lg shadow-black/[0.03] backdrop-blur-xl transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-xl dark:shadow-black/20"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="border-brand/15 bg-brand/10 text-brand flex size-10 items-center justify-center rounded-xl border transition-transform duration-200 group-hover/insight:scale-105">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <Badge variant="muted" className="text-[0.7rem]">
          Coming Soon
        </Badge>
      </div>
      <h3 className="font-heading text-sm font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Non-ready states                                                          */
/* -------------------------------------------------------------------------- */

function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col gap-10 pt-4 sm:pt-8" aria-hidden="true">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-12 w-80 max-w-full" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="border-border/70 bg-card/60 flex flex-col gap-4 rounded-3xl border p-7"
          >
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
      <div className="border-border/70 bg-card/60 flex flex-col gap-4 rounded-3xl border p-7">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <CenteredState
      icon={ScanSearch}
      title="Complaint not found"
      description="We couldn’t find this complaint. It may have been removed, or the link is incorrect."
    />
  );
}

function ErrorState() {
  return (
    <CenteredState
      icon={Loader2}
      title="We couldn’t load this analysis"
      description="Something went wrong while loading this complaint. Please refresh to try again."
    />
  );
}

function CenteredState({
  icon: Icon,
  title,
  description,
}: {
  icon: IconType;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center"
    >
      <span className="border-border/70 bg-card/60 text-muted-foreground flex size-14 items-center justify-center rounded-2xl border shadow-lg shadow-black/[0.03]">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h1 className="font-heading text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      <Button asChild variant="outline" size="sm" className="mt-2">
        <Link href="/dashboard">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to dashboard
        </Link>
      </Button>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type IconType = React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;

/** Locale date like "Jul 14, 2026". Falls back to the raw string if unparseable. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Locale date + time like "July 14, 2026 at 3:24 PM". */
function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
