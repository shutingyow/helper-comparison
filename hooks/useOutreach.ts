"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useOutreachHistory(candidateId: Id<"candidates"> | undefined) {
  return useQuery(
    api.outreach.listByCandidate,
    candidateId ? { candidateId } : "skip",
  );
}

export function useLatestOutreach(candidateId: Id<"candidates"> | undefined) {
  return useQuery(
    api.outreach.getLatestByCandidate,
    candidateId ? { candidateId } : "skip",
  );
}

export function useLatestOutreachBatch(candidateIds: Id<"candidates">[]) {
  return useQuery(
    api.outreach.getLatestForCandidates,
    candidateIds.length > 0 ? { candidateIds } : "skip",
  );
}

export function useRecordOutreachOpened() {
  return useMutation(api.outreach.recordOpened);
}

export function useMarkOutreachSent() {
  return useMutation(api.outreach.markSent);
}

export function useMarkOutreachReplied() {
  return useMutation(api.outreach.markReplied);
}
