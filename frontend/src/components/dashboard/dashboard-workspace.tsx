"use client";

import * as React from "react";
import { MotionConfig, motion } from "framer-motion";

import { LogoutButton } from "@/components/auth/logout-button";
import { ComplaintForm } from "@/components/complaints/complaint-form";
import { fadeUp, staggerContainer } from "@/components/dashboard/motion";
import { RecentComplaints } from "@/components/dashboard/recent-complaints";
import { SidebarCards } from "@/components/dashboard/sidebar-cards";
import { Wordmark } from "@/components/logo";

/** Time-of-day greeting. Computed on the client to match the user's timezone. */
function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * The premium AI workspace (UI-002). Replaces the single centered complaint
 * form with a full dashboard: a time-aware greeting, the glass composer as the
 * hero, an informative right rail, and recent complaints below.
 *
 * This component is presentation + composition only. All complaint submission
 * behavior still lives in <ComplaintForm/> and is unchanged.
 */
export function DashboardWorkspace() {
  // Greeting depends on the local clock, so resolve it after mount to avoid a
  // server/client hydration mismatch.
  const [greeting, setGreeting] = React.useState<string | null>(null);
  React.useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <main className="bg-background bg-ambient relative min-h-svh">
        <div className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-24 sm:px-8">
          {/* Top bar: brand + sign out. */}
          <header className="flex items-center justify-between py-5">
            <Wordmark />
            <LogoutButton />
          </header>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-10"
          >
            {/* Greeting + hero question. */}
            <motion.section variants={fadeUp} className="flex flex-col gap-3 pt-6 sm:pt-10">
              <p className="text-muted-foreground text-sm font-medium">
                <span className="text-brand">{greeting ?? "Welcome back"}</span>
                {greeting && " · Welcome back."}
              </p>
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
                What happened today?
              </h1>
              <p className="text-muted-foreground max-w-xl text-base leading-relaxed sm:text-lg">
                Describe your issue naturally. Cortexa will understand everything else.
              </p>
            </motion.section>

            {/* Composer (hero) + right rail. */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] lg:gap-8">
              <div className="min-w-0">
                <ComplaintForm />
              </div>
              <motion.aside
                variants={staggerContainer}
                aria-label="How Cortexa works"
                className="min-w-0"
              >
                <SidebarCards />
              </motion.aside>
            </div>

            {/* Recent complaints. */}
            <motion.div variants={fadeUp}>
              <RecentComplaints />
            </motion.div>
          </motion.div>
        </div>
      </main>
    </MotionConfig>
  );
}
