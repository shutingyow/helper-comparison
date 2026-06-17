"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { HardFilters, Preferences, RankingWeights } from "@/lib/types";

export function usePreferences() {
  return useQuery(api.preferences.get, {});
}

export function useUpdatePreferences() {
  const update = useMutation(api.preferences.update);
  const recalculate = useMutation(api.candidates.recalculateScores);

  return async (args: UpdatePreferencesArgs) => {
    await update(args);
    await recalculate({});
  };
}

export type { Preferences };

export type UpdatePreferencesArgs = {
  hardFilters?: HardFilters;
  rankingWeights?: RankingWeights;
  desiredSkills?: string[];
  targetStartDate?: string;
};
