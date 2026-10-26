import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Helper Hub",
  description:
    "Rank HelperPlace applicants against your preferences and manage hiring outreach in one place.",
};

export default function Home() {
  return <LandingPage />;
}
