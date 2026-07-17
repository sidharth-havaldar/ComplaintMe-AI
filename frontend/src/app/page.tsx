import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "ComplaintMe AI — Turn your problem into action",
  description:
    "ComplaintMe AI helps consumers create professional complaints and helps organizations transform complaints into business intelligence.",
};

export default function Home() {
  return <LandingPage />;
}
