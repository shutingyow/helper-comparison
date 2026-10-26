import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Helper Hub",
  description:
    "Find the perfect helper match without a middleman or agency fees. Rank HelperPlace applicants by your preferences and message on WhatsApp.",
};

export default function Home() {
  return <LandingPage />;
}
