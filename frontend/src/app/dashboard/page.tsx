import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/auth-guard";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata: Metadata = {
  title: "Dashboard — ComplaintMe AI",
};

/**
 * Placeholder route — the login flow redirects here after authentication.
 * Dashboard functionality is implemented in a later ticket.
 */
export default function DashboardPage() {
  return (
    <RequireAuth>
      <main className="bg-background flex min-h-svh items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Coming soon.</p>
          <LogoutButton />
        </div>
      </main>
    </RequireAuth>
  );
}
