import type { Metadata } from "next";

import { RegisterFlow } from "@/components/auth/register-flow";

export const metadata: Metadata = {
  title: "Create account — ComplaintMe AI",
  description: "Create your ComplaintMe AI account.",
};

export default function RegisterPage() {
  return <RegisterFlow />;
}
