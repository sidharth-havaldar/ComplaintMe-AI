"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseClient } from "@/lib/supabase";
import { isValidEmail } from "@/lib/validation";

/**
 * Requests a password reset email via Supabase.
 *
 * The success message is intentionally generic so it never reveals whether an
 * account exists for the submitted address.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  function validate(): boolean {
    if (!email.trim()) {
      setEmailError("Email is required.");
      return false;
    }
    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      return false;
    }
    setEmailError(null);
    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) {
      return;
    }

    setFormError(null);
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

      if (error) {
        setFormError("Unable to send the reset email. Please try again.");
        return;
      }

      setSent(true);
    } catch {
      setFormError("Unable to reach the authentication service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <FormAlert variant="success">
        If an account exists for this email, a password reset link has been sent.
      </FormAlert>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {formError && <FormAlert>{formError}</FormAlert>}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isLoading}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        {emailError && (
          <p id="email-error" role="alert" className="text-destructive text-sm">
            {emailError}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Sending reset link…
          </>
        ) : (
          "Send reset link"
        )}
      </Button>
    </form>
  );
}
