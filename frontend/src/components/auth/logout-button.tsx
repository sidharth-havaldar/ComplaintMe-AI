"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase";

/**
 * Ends the active Supabase session and redirects to /login.
 *
 * Reuses the shared browser client so authentication logic is not duplicated.
 * After sign-out the AuthGuard on protected routes sees no session, so the
 * dashboard is no longer accessible.
 */
export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleLogout() {
    if (isLoading) {
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError("Unable to sign out. Please try again.");
        return;
      }

      router.replace("/login");
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {error && <FormAlert>{error}</FormAlert>}
      <Button type="button" variant="outline" onClick={handleLogout} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Signing out…
          </>
        ) : (
          "Sign out"
        )}
      </Button>
    </div>
  );
}
