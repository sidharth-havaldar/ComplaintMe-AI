"use client";

import { MotionConfig, motion } from "framer-motion";

import { LogoutButton } from "@/components/auth/logout-button";
import { ComplaintForm } from "@/components/complaints/complaint-form";
import { CopilotGuidance } from "@/components/dashboard/copilot-guidance";
import { fadeUp, staggerContainer } from "@/components/dashboard/motion";
import { RecentComplaints } from "@/components/dashboard/recent-complaints";
import { Wordmark } from "@/components/logo";

/**
 * The Consumer Copilot entry experience (COP-001). One clear invitation —
 * "Tell us what happened." — over a full-width composer, followed by guidance
 * on what to include and which evidence helps, then the user's recent
 * complaints.
 *
 * This component is presentation + composition only. All complaint submission
 * behavior still lives in <ComplaintForm/> and is unchanged.
 */
export function DashboardWorkspace() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="bg-background bg-ambient relative min-h-svh">
        <div className="flex w-full flex-col px-5 pb-24 sm:px-8 lg:px-14 xl:px-20">
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
            {/* Copilot invitation. */}
            <motion.section
              variants={fadeUp}
              className="flex flex-col items-center gap-4 pt-10 text-center sm:pt-16"
            >
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
                Tell us what happened.
              </h1>
              <p className="text-muted-foreground max-w-2xl text-base leading-relaxed text-balance sm:text-lg">
                Don&apos;t worry about writing a formal complaint. Describe your situation
                naturally — we&apos;ll create a professional complaint for you.
              </p>
            </motion.section>

            {/* Full-width composer. */}
            <ComplaintForm />

            {/* Helpful tips + evidence guidance. */}
            <CopilotGuidance />

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
