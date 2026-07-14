import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/auth-guard";
import { ComplaintWorkspace } from "@/components/complaints/complaint-workspace";

export const metadata: Metadata = {
  title: "Complaint Intelligence — ComplaintMe AI",
};

/**
 * Complaint detail route (UI-004) — the Cortexa Intelligence Workspace.
 *
 * Guarded by RequireAuth so only authenticated users can reach it. The dynamic
 * `[id]` segment is handed to <ComplaintWorkspace/>, which fetches the complaint
 * client-side via the existing read-only GET /complaints/{id} endpoint. No
 * backend, API, auth or routing behavior is introduced here — presentation only.
 */
export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RequireAuth>
      <ComplaintWorkspace id={id} />
    </RequireAuth>
  );
}
