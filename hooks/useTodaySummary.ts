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
  const since = latestScrape?.startedAt ?? 0;
  const newCandidates = useNewSince(latestScrape === undefined ? undefined : since);
  const allPassing = useCandidateList({ passesHardFiltersOnly: true });

  return useMemo(() => {
    if (latestScrape === undefined || newCandidates === undefined || allPassing === undefined) {
      return undefined;
    }

    const topByScore = [...allPassing]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      newSinceLastScrape: newCandidates,
      topByScore,
      lastScrapeAt: latestScrape?.finishedAt,
      newCount: newCandidates.length,
    };
  }, [latestScrape, newCandidates, allPassing]);
}
