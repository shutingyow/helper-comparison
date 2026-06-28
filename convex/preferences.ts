import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";
import { recalculateCandidatesForUser } from "./lib/candidateScoring";
import {
  DEFAULT_DESIRED_SKILLS,
  DEFAULT_HARD_FILTERS,
  DEFAULT_RANKING_WEIGHTS,
  defaultTargetStartDate,
  mergeHardFilters,
} from "./lib/ranking";

const hardFiltersValidator = v.object({
  requireReferenceLetter: v.boolean(),
  requireStartByOct2026: v.boolean(),
  requireFinishedContractOrSingapore: v.boolean(),
  requireEnglish: v.boolean(),
  requireBabyChildCareInRecentWork: v.boolean(),
});

const rankingWeightsValidator = v.object({
  perReferenceLetter: v.number(),
  perDesiredSkill: v.number(),
  perYearExperience: v.number(),
  maxExperienceBonus: v.number(),
  startDateWithinTwoWeeks: v.number(),
  finishedContractSingaporeBonus: v.number(),
  profileCompleteness: v.number(),
});

const preferencesDoc = v.object({
  _id: v.id("preferences"),
  _creationTime: v.number(),
  userId: v.optional(v.id("users")),
  singleton: v.optional(v.literal(true)),
  hardFilters: hardFiltersValidator,
  rankingWeights: rankingWeightsValidator,
  desiredSkills: v.array(v.string()),
  targetStartDate: v.string(),
});

export const get = query({
  args: {},
  returns: v.union(preferencesDoc, v.null()),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const prefs = await ctx.db
      .query("preferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!prefs) return null;

    return {
      ...prefs,
      hardFilters: mergeHardFilters(prefs.hardFilters),
    };
  },
});

export const initialize = mutation({
  args: {},
  returns: v.id("preferences"),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const existing = await ctx.db
      .query("preferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("preferences", {
      userId: user._id,
      hardFilters: { ...DEFAULT_HARD_FILTERS },
      rankingWeights: DEFAULT_RANKING_WEIGHTS,
      desiredSkills: DEFAULT_DESIRED_SKILLS,
      targetStartDate: defaultTargetStartDate(),
    });
  },
});

export const update = mutation({
  args: {
    hardFilters: v.optional(hardFiltersValidator),
    rankingWeights: v.optional(rankingWeightsValidator),
    desiredSkills: v.optional(v.array(v.string())),
    targetStartDate: v.optional(v.string()),
  },
  returns: v.id("preferences"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const existing = await ctx.db
      .query("preferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const prefsId =
      existing?._id ??
      (await ctx.db.insert("preferences", {
        userId: user._id,
        hardFilters: { ...DEFAULT_HARD_FILTERS },
        rankingWeights: DEFAULT_RANKING_WEIGHTS,
        desiredSkills: DEFAULT_DESIRED_SKILLS,
        targetStartDate: defaultTargetStartDate(),
      }));

    const updates: Record<string, unknown> = {};

    if (args.hardFilters !== undefined) {
      // Persist the user's explicit on/off choices for every filter.
      updates.hardFilters = {
        requireReferenceLetter: args.hardFilters.requireReferenceLetter,
        requireStartByOct2026: args.hardFilters.requireStartByOct2026,
        requireFinishedContractOrSingapore:
          args.hardFilters.requireFinishedContractOrSingapore,
        requireEnglish: args.hardFilters.requireEnglish,
        requireBabyChildCareInRecentWork:
          args.hardFilters.requireBabyChildCareInRecentWork,
      };
    }
    if (args.rankingWeights !== undefined) {
      updates.rankingWeights = args.rankingWeights;
    }
    if (args.desiredSkills !== undefined) {
      updates.desiredSkills = args.desiredSkills;
    }
    if (args.targetStartDate !== undefined) {
      updates.targetStartDate = args.targetStartDate;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch("preferences", prefsId, updates);
      await recalculateCandidatesForUser(ctx, user._id);
    }

    return prefsId;
  },
});
