"use client";

import { useTodaySummary } from "@/hooks/useTodaySummary";
import { useUpcomingInterviews } from "@/hooks/useInterviews";
import { TodaySummary } from "@/components/TodaySummary";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { ConvexGuard } from "@/components/ConvexGuard";

export default function TodayPage() {
  const summary = useTodaySummary();
  const upcomingInterviews = useUpcomingInterviews();

  const loading = summary === undefined || upcomingInterviews === undefined;

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
        ) : summary.newCount === 0 &&
          summary.topByScore.length === 0 &&
          upcomingInterviews.length === 0 ? (
          <EmptyState
            title="Nothing new today"
            description="Your daily summary will appear after the first scrape."
          />
        ) : (
          <TodaySummary summary={summary} upcomingInterviews={upcomingInterviews} />
        )}
      </ConvexGuard>
    </div>
  );
}
