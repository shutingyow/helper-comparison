"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { HardFilters, Preferences, RankingWeights } from "@/lib/types";

export function usePreferences() {
  return useQuery(api.preferences.get, {});
}

export function useUpdatePreferences() {
  const update = useMutation(api.preferences.update);

  return async (args: UpdatePreferencesArgs) => {
    await update(args);
  };
}

export type { Preferences };

export type UpdatePreferencesArgs = {
  hardFilters?: HardFilters;
  rankingWeights?: RankingWeights;
  desiredSkills?: string[];
  targetStartDate?: string;
};
