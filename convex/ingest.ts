import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { candidateIngestValidator } from "./lib/candidateFields";
import {
  DEFAULT_DESIRED_SKILLS,
  DEFAULT_HARD_FILTERS,
  DEFAULT_RANKING_WEIGHTS,
  defaultTargetStartDate,
} from "./lib/ranking";
import { scoreCandidate } from "./lib/candidateScoring";
import { sortWorkHistoryByRecency } from "./lib/workHistory";

const scrapeRunInput = v.object({
  startedAt: v.number(),
  finishedAt: v.number(),
  errors: v.optional(v.array(v.string())),
});

async function getOrCreatePreferences(
  ctx: { db: import("./_generated/server").MutationCtx["db"] },
  userId: Id<"users">,
) {
  const existing = await ctx.db
    .query("preferences")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  if (existing) return existing;

  const id = await ctx.db.insert("preferences", {
    userId,
    hardFilters: { ...DEFAULT_HARD_FILTERS },
    rankingWeights: DEFAULT_RANKING_WEIGHTS,
    desiredSkills: DEFAULT_DESIRED_SKILLS,
    targetStartDate: defaultTargetStartDate(),
  });

  const created = await ctx.db.get("preferences", id);
  if (!created) throw new Error("Failed to create preferences");
  return created;
}

export const batch = internalMutation({
  args: {
    userId: v.id("users"),
    candidates: v.array(candidateIngestValidator),
    scrapeRun: scrapeRunInput,
  },
  returns: v.object({
    newCount: v.number(),
    updatedCount: v.number(),
    scrapeRunId: v.id("scrapeRuns"),
  }),
  handler: async (ctx, args) => {
    const prefs = await getOrCreatePreferences(ctx, args.userId);
    const now = Date.now();
    let newCount = 0;
    let updatedCount = 0;

    for (const raw of args.candidates) {
      const sortedWorkHistory = sortWorkHistoryByRecency(raw.workHistory);

      const scored = scoreCandidate(
        {
          ...raw,
          workHistory: sortedWorkHistory,
        },
        prefs,
      );

      const existing = await ctx.db
        .query("candidates")
        .withIndex("by_user_and_helper_place_id", (q) =>
          q.eq("userId", args.userId).eq("helperPlaceId", raw.helperPlaceId),
        )
        .unique();

      const fields = {
        userId: args.userId,
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
        availableFromTimestamp: scored.availableFromTimestamp,
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
        phone: scored.phone,
        whatsapp: scored.whatsapp,
        rawHtml: raw.rawHtml,
        scrapedAt: raw.scrapedAt ?? now,
        score: scored.score,
        passesHardFilters: scored.passesHardFilters,
        filterResults: scored.filterResults,
        lastSeenAt: now,
      };

      if (existing) {
        await ctx.db.patch("candidates", existing._id, {
          ...fields,
          phone: scored.phone ?? existing.phone,
          whatsapp: scored.whatsapp ?? existing.whatsapp,
        });
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
      userId: args.userId,
      startedAt: args.scrapeRun.startedAt,
      finishedAt: args.scrapeRun.finishedAt,
      newCount,
      updatedCount,
      errors: args.scrapeRun.errors ?? [],
    });

    const creds = await ctx.db
      .query("scraperCredentials")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (creds) {
      await ctx.db.patch("scraperCredentials", creds._id, {
        lastScrapeAt: args.scrapeRun.finishedAt,
        updatedAt: now,
      });
    }

    return { newCount, updatedCount, scrapeRunId };
  },
});
