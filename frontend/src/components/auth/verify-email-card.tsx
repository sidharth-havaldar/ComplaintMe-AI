"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Loader2, MailCheck } from "lucide-react";

import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toFriendlyAuthError } from "@/lib/auth-errors";
import { getSupabaseClient } from "@/lib/supabase";

const RESEND_COOLDOWN_SECONDS = 60;

const TIPS = [
  "Check your Spam folder",
  "Check the Promotions tab",
  "Email usually arrives within one minute",
];

/**
 * Post-registration success screen shown instead of a redirect.
 *
 * Confirms where the verification email went, offers troubleshooting tips,
 * and lets the user resend the email or head to the login page.
 */
export function VerifyEmailCard({ email }: { email: string }) {
  const [isResending, setIsResending] = React.useState(false);
  const [resendMessage, setResendMessage] = React.useState<string | null>(null);
  const [resendError, setResendError] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleResend() {
    if (isResending || cooldown > 0) {
      return;
    }

    setResendMessage(null);
    setResendError(null);
    setIsResending(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resend({ type: "signup", email });

      if (error) {
        setResendError(toFriendlyAuthError(error.message));
        return;
      }

      setResendMessage("Verification email sent again. Give it a minute to arrive.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setResendError("Unable to reach the authentication service. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div
          aria-hidden="true"
          className="bg-success/10 text-success mx-auto mb-1 flex size-12 items-center justify-center rounded-full"
        >
          <MailCheck className="size-6" />
        </div>
        <CardTitle>🎉 Verify your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification email to <strong className="text-foreground font-medium">{email}</strong>.
          Please click the verification link before signing in.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ul className="flex flex-col gap-2.5 text-sm">
          {TIPS.map((tip) => (
            <li key={tip} className="text-muted-foreground flex items-center gap-2.5">
              <Check aria-hidden="true" className="text-success size-4 shrink-0" />
              {tip}
            </li>
          ))}
        </ul>

        {resendMessage && <FormAlert variant="success">{resendMessage}</FormAlert>}
        {resendError && <FormAlert>{resendError}</FormAlert>}

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Resending…
              </>
            ) : cooldown > 0 ? (
              `Resend email (${cooldown}s)`
            ) : (
              "Resend email"
            )}
          </Button>
          <Button asChild variant="brand" size="lg" className="w-full">
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
