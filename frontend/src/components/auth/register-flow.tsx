"use client";

import * as React from "react";
import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { VerifyEmailCard } from "@/components/auth/verify-email-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Switches between the registration form and the post-signup email
 * verification screen once a confirmation email has been sent.
 */
export function RegisterFlow() {
  const [confirmationEmail, setConfirmationEmail] = React.useState<string | null>(null);

  if (confirmationEmail) {
    return <VerifyEmailCard email={confirmationEmail} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Start turning complaints into insights.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <RegisterForm onConfirmationSent={setConfirmationEmail} />
        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
