"use client";

import { useMemo } from "react";
import {
  useCandidateList,
  useLatestScrapeRun,
  useNewSince,
} from "@/hooks/useCandidates";
import type { TodaySummary } from "@/lib/types";

export function useTodaySummary(): TodaySummary | undefined {
  const latestScrape = useLatestScrapeRun();
  const since = latestScrape?.startedAt;
  const newCandidates = useNewSince(
    latestScrape === undefined ? undefined : since,
    { excludeRejected: true },
  );
  const allPassing = useCandidateList({
    passesHardFiltersOnly: true,
    excludeRejected: true,
  });

  return useMemo(() => {
    if (latestScrape === undefined || allPassing === undefined) {
      return undefined;
    }
    if (since !== undefined && newCandidates === undefined) {
      return undefined;
    }

    const newSinceLastScrape = newCandidates ?? [];
    const topByScore = [...allPassing]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      newSinceLastScrape,
      topByScore,
      lastScrapeAt: latestScrape?.finishedAt,
      newCount: latestScrape?.newCount ?? newSinceLastScrape.length,
    };
  }, [latestScrape, newCandidates, allPassing, since]);
}
