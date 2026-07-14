"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Inbox } from "lucide-react";

import { fadeUp, staggerContainer } from "@/components/dashboard/motion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listComplaints, type Complaint } from "@/lib/api";
import { cn } from "@/lib/utils";

type LoadState = "loading" | "ready" | "error";

/** Map a backend status string to a badge variant + human label. */
function statusPresentation(status: string): {
  variant: React.ComponentProps<typeof Badge>["variant"];
  label: string;
} {
  const normalized = status.toLowerCase();
  if (normalized.includes("resolve") || normalized.includes("close")) {
    return { variant: "success", label: prettifyStatus(status) };
  }
  if (normalized.includes("progress") || normalized.includes("review")) {
    return { variant: "brand", label: prettifyStatus(status) };
  }
  if (normalized.includes("reject") || normalized.includes("fail")) {
    return { variant: "destructive", label: prettifyStatus(status) };
  }
  return { variant: "muted", label: prettifyStatus(status) };
}

/** "in_progress" -> "In progress". */
function prettifyStatus(status: string): string {
  const spaced = status.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Locale date like "Jul 14, 2026". Falls back to the raw string if unparseable. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * "Recent Complaints" surface. Read-only: fetches the user's complaints via the
 * existing GET /complaints endpoint and renders them as premium, hoverable
 * cards. Loading, empty, and error states are all handled gracefully so the
 * section never looks broken.
 */
export function RecentComplaints() {
  const [state, setState] = React.useState<LoadState>("loading");
  const [complaints, setComplaints] = React.useState<Complaint[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    listComplaints()
      .then((data) => {
        if (cancelled) return;
        setComplaints(data);
        setState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-labelledby="recent-heading" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 id="recent-heading" className="font-heading text-lg font-semibold tracking-tight">
          Recent complaints
        </h2>
        {state === "ready" && complaints.length > 0 && (
          <span className="text-muted-foreground text-sm">
            {complaints.length} total
          </span>
        )}
      </div>

      {state === "loading" && <RecentSkeletons />}

      {state === "error" && (
        <p className="text-muted-foreground rounded-2xl border border-border/70 bg-card/60 p-6 text-sm">
          We couldn’t load your recent complaints right now. Please refresh to try again.
        </p>
      )}

      {state === "ready" && complaints.length === 0 && <EmptyState />}

      {state === "ready" && complaints.length > 0 && (
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <AnimatePresence>
            {complaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </section>
  );
}

function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const { variant, label } = statusPresentation(complaint.current_status);
  const preview = complaint.title?.trim() || complaint.description;

  return (
    <motion.li variants={fadeUp}>
      <Link
        href={`/complaints/${complaint.id}`}
        className={cn(
          "group/item relative flex h-full flex-col gap-3 rounded-2xl border border-border/70 bg-card/70 p-5 shadow-lg shadow-black/[0.03] backdrop-blur-xl transition-all duration-200 ease-out",
          "hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-xl",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 outline-none",
          "dark:shadow-black/20"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <Badge variant={variant}>{label}</Badge>
          <time
            dateTime={complaint.created_at}
            className="text-muted-foreground text-xs tabular-nums"
          >
            {formatDate(complaint.created_at)}
          </time>
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-foreground/90">{preview}</p>

        <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover/item:text-brand">
          View analysis
          <ArrowUpRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-200 group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5"
          />
        </span>
      </Link>
    </motion.li>
  );
}

function EmptyState() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-2xl border border-brand/15 bg-brand/10 text-brand">
        <Inbox aria-hidden="true" className="size-6" />
      </span>
      <p className="font-medium">No complaints yet</p>
      <p className="text-muted-foreground max-w-xs text-sm">
        When you describe an issue above, it will appear here with Cortexa’s analysis.
      </p>
    </motion.div>
  );
}

function RecentSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-hidden="true">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/60 p-5"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="mt-1 h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
