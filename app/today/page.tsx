"use client";

import { useTodaySummary } from "@/hooks/useTodaySummary";
import { TodaySummary } from "@/components/TodaySummary";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { ConvexGuard } from "@/components/ConvexGuard";

export default function TodayPage() {
  const summary = useTodaySummary();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Today</h1>
        <p className="mt-1 text-sm text-stone-500">
          Daily consolidation — new since last scrape and top candidates by score.
        </p>
      </header>

      <ConvexGuard>
        {summary === undefined ? (
          <LoadingState rows={4} />
        ) : summary.newCount === 0 && summary.topByScore.length === 0 ? (
          <EmptyState
            title="Nothing new today"
            description="Your daily summary will appear after the first scrape."
          />
        ) : (
          <TodaySummary summary={summary} />
        )}
      </ConvexGuard>
    </div>
  );
}
