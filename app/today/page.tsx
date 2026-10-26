"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTodaySummary } from "@/hooks/useTodaySummary";
import { useUpcomingInterviews } from "@/hooks/useInterviews";
import { TodaySummary } from "@/components/TodaySummary";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { ConvexGuard } from "@/components/ConvexGuard";
import { Button } from "@/components/ui/button";

export default function TodayPage() {
  const summary = useTodaySummary();
  const upcomingInterviews = useUpcomingInterviews();
  const credentials = useQuery(api.scraperCredentials.getForCurrentUser);

  const loading =
    summary === undefined ||
    upcomingInterviews === undefined ||
    credentials === undefined;

  const isEmpty =
    !loading &&
    !summary.lastScrapeAt &&
    summary.newCount === 0 &&
    summary.topByScore.length === 0 &&
    upcomingInterviews.length === 0;

  const hasCredentials = credentials?.hasPassword === true;
  const showConnectCta = isEmpty && !hasCredentials;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Today</h1>
        <p className="mt-1 text-sm text-stone-500">
          Daily consolidation — new since last scrape, upcoming interviews, and top candidates.
        </p>
      </header>

      <ConvexGuard>
        {loading ? (
          <LoadingState rows={4} />
        ) : showConnectCta ? (
          <EmptyState
            title="Connect HelperPlace to import your applicants"
            description="Save your HelperPlace employer credentials in settings. After you save, applicants are imported automatically every day at 8:00am Singapore time."
            icon={<KeyRound className="h-6 w-6" />}
            action={
              <Link href="/settings">
                <Button type="button">Connect HelperPlace</Button>
              </Link>
            }
          />
        ) : isEmpty ? (
          <EmptyState
            title="Nothing new today"
            description={
              hasCredentials
                ? "Your daily summary will appear after the next import (around 8:00am Singapore time)."
                : "Your daily summary will appear after the first scrape."
            }
          />
        ) : (
          <TodaySummary summary={summary} upcomingInterviews={upcomingInterviews} />
        )}
      </ConvexGuard>
    </div>
  );
}
