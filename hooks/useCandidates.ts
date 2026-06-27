"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { CandidateStatus } from "@/lib/types";
import type { Id } from "@/convex/_generated/dataModel";

export function useCandidateList(args?: {
  status?: CandidateStatus;
  passesHardFiltersOnly?: boolean;
  excludeRejected?: boolean;
}) {
  return useQuery(api.candidates.list, args ?? {});
}

export function useInboxCandidates() {
  return useQuery(api.candidates.list, { excludeRejected: true });
}

export function useCandidate(candidateId: Id<"candidates"> | undefined) {
  return useQuery(
    api.candidates.getById,
    candidateId ? { candidateId } : "skip",
  );
}

export function useExcludedCandidates() {
  return useQuery(api.candidates.listExcluded, {});
}

export function useNewSince(since: number | undefined) {
  return useQuery(
    api.candidates.listNewSince,
    since !== undefined ? { since } : "skip",
  );
}

export function useLatestScrapeRun() {
  return useQuery(api.scrapeRuns.latest, {});
}

export function useOutreachCandidates(args?: {
  status?: CandidateStatus;
  includeAll?: boolean;
}) {
  return useQuery(api.candidates.listForOutreach, args ?? {});
}

export function useUpdateStatus() {
  return useMutation(api.candidates.updateStatus);
}

export function useUpdateNotes() {
  return useMutation(api.candidates.updateNotes);
}

export function useMarkMessaged() {
  return useMutation(api.candidates.markMessaged);
}

export type { Candidate, TodaySummary } from "@/lib/types";
export { useTodaySummary } from "@/hooks/useTodaySummary";
