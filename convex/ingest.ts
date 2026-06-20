import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { candidateIngestValidator } from "./lib/candidateFields";
import {
  DEFAULT_DESIRED_SKILLS,
  DEFAULT_HARD_FILTERS,
  DEFAULT_RANKING_WEIGHTS,
  computeScore,
  evaluateHardFilters,
  parseHelperPlaceDate,
  passesAllHardFilters,
} from "./lib/ranking";
import { normalizeSingaporePhone } from "./lib/phone";
import { sortWorkHistoryByRecency } from "./lib/workHistory";

const scrapeRunInput = v.object({
  startedAt: v.number(),
  finishedAt: v.number(),
  errors: v.optional(v.array(v.string())),
});

async function getOrCreatePreferences(ctx: {
  db: import("./_generated/server").MutationCtx["db"];
}) {
  const existing = await ctx.db
    .query("preferences")
    .withIndex("by_singleton", (q) => q.eq("singleton", true))
    .unique();

  if (existing) return existing;

  const id = await ctx.db.insert("preferences", {
    singleton: true,
    hardFilters: DEFAULT_HARD_FILTERS,
    rankingWeights: DEFAULT_RANKING_WEIGHTS,
    desiredSkills: DEFAULT_DESIRED_SKILLS,
    targetStartDate: "2026-10-01",
  });

  const created = await ctx.db.get("preferences", id);
  if (!created) throw new Error("Failed to create preferences");
  return created;
}

export const batch = internalMutation({
  args: {
    candidates: v.array(candidateIngestValidator),
    scrapeRun: scrapeRunInput,
  },
  returns: v.object({
    newCount: v.number(),
    updatedCount: v.number(),
    scrapeRunId: v.id("scrapeRuns"),
  }),
  handler: async (ctx, args) => {
    const prefs = await getOrCreatePreferences(ctx);
    const now = Date.now();
    let newCount = 0;
    let updatedCount = 0;

    for (const raw of args.candidates) {
      const availableFromTimestamp = raw.availableFrom
        ? parseHelperPlaceDate(raw.availableFrom)
        : undefined;
      const phone = normalizeSingaporePhone(raw.phone);
      const whatsapp = normalizeSingaporePhone(raw.whatsapp ?? raw.phone);

      const hardFilters = {
        ...DEFAULT_HARD_FILTERS,
        ...prefs.hardFilters,
      };

      const sortedWorkHistory = sortWorkHistoryByRecency(raw.workHistory);

      const candidateInput = {
        hasReferenceLetter: raw.hasReferenceLetter,
        referenceLetterCount: raw.referenceLetterCount,
        availableFrom: raw.availableFrom,
        availableFromTimestamp,
        contractStatus: raw.contractStatus,
        presentLocation: raw.presentLocation,
        languages: raw.languages,
        skills: raw.skills,
        yearsExperience: raw.yearsExperience,
        name: raw.name,
        age: raw.age,
        gender: raw.gender,
        nationality: raw.nationality,
        aboutMe: raw.aboutMe,
        workHistory: sortedWorkHistory,
      };

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

      const existing = await ctx.db
        .query("candidates")
        .withIndex("by_helper_place_id", (q) =>
          q.eq("helperPlaceId", raw.helperPlaceId),
        )
        .unique();

      const fields = {
        helperPlaceId: raw.helperPlaceId,
        profileUrl: raw.profileUrl,
        name: raw.name,
        age: raw.age,
        gender: raw.gender,
        nationality: raw.nationality,
        yearsExperience: raw.yearsExperience,
        contractStatus: raw.contractStatus,
        presentLocation: raw.presentLocation,
        availableFrom: raw.availableFrom,
        availableFromTimestamp,
        skills: raw.skills,
        languages: raw.languages,
        cookingSkills: raw.cookingSkills,
        personalityTraits: raw.personalityTraits,
        hasReferenceLetter: raw.hasReferenceLetter,
        referenceLetterCount: raw.referenceLetterCount,
        workHistory: sortedWorkHistory,
        aboutMe: raw.aboutMe,
        education: raw.education,
        salaryExpectation: raw.salaryExpectation,
        accommodation: raw.accommodation,
        dayOff: raw.dayOff,
        phone,
        whatsapp,
        rawHtml: raw.rawHtml,
        scrapedAt: raw.scrapedAt ?? now,
        score,
        passesHardFilters,
        filterResults,
        lastSeenAt: now,
      };

      if (existing) {
        await ctx.db.patch("candidates", existing._id, fields);
        updatedCount += 1;
      } else {
        await ctx.db.insert("candidates", {
          ...fields,
          status: "new",
          firstSeenAt: now,
        });
        newCount += 1;
      }
    }

    const scrapeRunId = await ctx.db.insert("scrapeRuns", {
      startedAt: args.scrapeRun.startedAt,
      finishedAt: args.scrapeRun.finishedAt,
      newCount,
      updatedCount,
      errors: args.scrapeRun.errors ?? [],
    });

    return { newCount, updatedCount, scrapeRunId };
  },
});
