"use client";

import { useCandidateList } from "@/hooks/useCandidates";
import { CandidateTable } from "@/components/CandidateTable";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ConvexGuard } from "@/components/ConvexGuard";

export default function InboxPage() {
  const candidates = useCandidateList();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Inbox</h1>
        <p className="mt-1 text-sm text-stone-500">
          All candidates — sort by score, date, or start date and filter by status.
        </p>
      </header>

      <ConvexGuard>
        {candidates === undefined ? (
          <LoadingState rows={8} />
        ) : candidates.length === 0 ? (
          <EmptyState
            title="No candidates yet"
            description="Run a scrape to import profiles from HelperPlace."
          />
        ) : (
          <CandidateTable candidates={candidates} />
        )}
      </ConvexGuard>
    </div>
  );
}
