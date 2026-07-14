import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/auth-guard";
import { LogoutButton } from "@/components/auth/logout-button";
import { ComplaintForm } from "@/components/complaints/complaint-form";

export const metadata: Metadata = {
  title: "New Complaint — ComplaintMe AI",
};

/**
 * Primary post-login experience — complaint submission (CMP-003).
 * Guarded by RequireAuth so only authenticated users can reach it.
 */
export default function DashboardPage() {
  return (
    <RequireAuth>
      <main className="bg-background flex min-h-svh flex-col">
        <header className="flex justify-end p-4">
          <LogoutButton />
        </header>
        <div className="flex flex-1 items-center justify-center px-6 pb-20">
          <ComplaintForm />
        </div>
      </main>
    </RequireAuth>
  );
}
