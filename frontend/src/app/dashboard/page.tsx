import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/auth-guard";
import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";

export const metadata: Metadata = {
  title: "Dashboard — ComplaintMe AI",
};

/**
 * Primary post-login experience — the premium AI workspace (UI-002).
 * Guarded by RequireAuth so only authenticated users can reach it. All
 * complaint submission behavior lives inside the workspace's <ComplaintForm/>.
 */
export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardWorkspace />
    </RequireAuth>
  );
}
