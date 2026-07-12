import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in — ComplaintMe AI",
  description: "Sign in to your ComplaintMe AI account.",
};

export default function LoginPage() {
  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-4 sm:p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-2xl font-semibold tracking-tight">
            ComplaintMe <span className="text-primary">AI</span>
          </span>
          <p className="text-muted-foreground text-sm">
            Tell us what happened. We&apos;ll understand the rest.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your email and password to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
