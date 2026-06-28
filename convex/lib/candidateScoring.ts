import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  computeScore,
  evaluateHardFilters,
  mergeHardFilters,
  parseHelperPlaceDate,
  passesAllHardFilters,
  type CandidateInput,
} from "./ranking";
import { normalizeSingaporePhone } from "./phone";
import { sortWorkHistoryByRecency } from "./workHistory";

export async function getPreferencesForUser(
  ctx: { db: QueryCtx["db"] | MutationCtx["db"] },
  userId: Id<"users">,
): Promise<Doc<"preferences">> {
  const prefs = await ctx.db
    .query("preferences")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  if (!prefs) {
    throw new Error(
      "Preferences not initialized. Open Preferences to set up your account.",
    );
  }

  return prefs;
}

export function scoreCandidate(
  input: {
    availableFrom?: string;
    phone?: string;
    whatsapp?: string;
    hasReferenceLetter: boolean;
    referenceLetterCount: number;
    contractStatus?: string;
    presentLocation?: string;
    languages: string[];
    skills: string[];
    yearsExperience?: number;
    name: string;
    age?: number;
    gender?: string;
    nationality?: string;
    aboutMe?: string;
    workHistory: CandidateInput["workHistory"];
  },
  prefs: Doc<"preferences">,
) {
  const availableFromTimestamp =
    input.availableFrom !== undefined
      ? parseHelperPlaceDate(input.availableFrom)
      : undefined;

  const phone = normalizeSingaporePhone(input.phone);
  const whatsapp = normalizeSingaporePhone(input.whatsapp ?? input.phone);

  const candidateInput: CandidateInput = {
    hasReferenceLetter: input.hasReferenceLetter,
    referenceLetterCount: input.referenceLetterCount,
    availableFrom: input.availableFrom,
    availableFromTimestamp,
    contractStatus: input.contractStatus,
    presentLocation: input.presentLocation,
    languages: input.languages,
    skills: input.skills,
    yearsExperience: input.yearsExperience,
    name: input.name,
    age: input.age,
    gender: input.gender,
    nationality: input.nationality,
    aboutMe: input.aboutMe,
    workHistory: input.workHistory,
  };

  const hardFilters = mergeHardFilters(prefs.hardFilters);
  const filterResults = evaluateHardFilters(
    candidateInput,
    hardFilters,
    prefs.targetStartDate,
  );
  const passesHardFilters = passesAllHardFilters(filterResults);
  const score = computeScore(
    candidateInput,
    prefs.rankingWeights,
    prefs.desiredSkills,
    prefs.targetStartDate,
  );

  return {
    availableFromTimestamp,
    phone,
    whatsapp,
    filterResults,
    passesHardFilters,
    score,
  };
}

export async function recalculateCandidatesForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<number> {
  const prefs = await getPreferencesForUser(ctx, userId);
  const candidates = await ctx.db
    .query("candidates")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  let updated = 0;
  for (const candidate of candidates) {
    const enriched = scoreCandidate(candidate, prefs);
    await ctx.db.patch("candidates", candidate._id, {
      availableFromTimestamp: enriched.availableFromTimestamp,
      phone: enriched.phone ?? candidate.phone,
      whatsapp: enriched.whatsapp ?? candidate.whatsapp,
      workHistory: sortWorkHistoryByRecency(candidate.workHistory),
      filterResults: enriched.filterResults,
      passesHardFilters: enriched.passesHardFilters,
      score: enriched.score,
    });
    updated += 1;
  }

  return updated;
}
