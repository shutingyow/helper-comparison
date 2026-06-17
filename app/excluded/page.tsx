"use client";

import { useExcludedCandidates } from "@/hooks/useCandidates";
import { CandidateTable } from "@/components/CandidateTable";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ConvexGuard } from "@/components/ConvexGuard";

export default function ExcludedPage() {
  const candidates = useExcludedCandidates();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Excluded</h1>
        <p className="mt-1 text-sm text-stone-500">
          Candidates who didn&apos;t pass hard filters — review reasons below.
        </p>
      </header>

      <ConvexGuard>
        {candidates === undefined ? (
          <LoadingState rows={6} />
        ) : candidates.length === 0 ? (
          <EmptyState
            title="No excluded candidates"
            description="Everyone passed your hard filters, or no profiles scraped yet."
          />
        ) : (
          <CandidateTable candidates={candidates} showFilters={false} />
        )}
      </ConvexGuard>
    </div>
  );
}
