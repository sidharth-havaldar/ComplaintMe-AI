import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in — ComplaintMe AI",
  description: "Sign in to your ComplaintMe AI account.",
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your email and password to continue.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <LoginForm />
        <div className="flex flex-col gap-2 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary underline-offset-4 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
