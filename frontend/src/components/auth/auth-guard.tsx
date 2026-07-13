"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";

/**
 * Client-side route protection for the App Router.
 *
 * Sessions are persisted by @supabase/supabase-js in the browser (localStorage),
 * so authentication state is only available on the client. These guards read the
 * current session, keep it in sync via onAuthStateChange (covering refresh and
 * returning users), and redirect as needed — while showing a loading state to
 * prevent protected or auth UI from flashing before the check completes.
 *
 * Reuse `RequireAuth` for future authenticated routes to avoid duplicating logic.
 */

type AuthStatus = "checking" | "authed" | "unauthed";

function AuthLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-svh items-center justify-center p-6"
    >
      <Loader2 aria-hidden="true" className="text-muted-foreground size-6 animate-spin" />
      <span className="sr-only">Checking your session…</span>
    </div>
  );
}

function useAuthStatus(): AuthStatus {
  const [status, setStatus] = React.useState<AuthStatus>("checking");

  React.useEffect(() => {
    const supabase = getSupabaseClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setStatus(data.session ? "authed" : "unauthed");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setStatus(session ? "authed" : "unauthed");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return status;
}

/** Renders children only for authenticated users; redirects guests to /login. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuthStatus();

  React.useEffect(() => {
    if (status === "unauthed") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authed") {
    return <AuthLoading />;
  }

  return <>{children}</>;
}

/** Renders children only for guests; redirects authenticated users to /dashboard. */
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuthStatus();

  React.useEffect(() => {
    if (status === "authed") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status !== "unauthed") {
    return <AuthLoading />;
  }

  return <>{children}</>;
}
