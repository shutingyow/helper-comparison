import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { candidateStatus, filterResult, workHistoryEntry } from "./schema";
import {
  computeScore,
  DEFAULT_HARD_FILTERS,
  evaluateHardFilters,
  parseHelperPlaceDate,
  passesAllHardFilters,
  type CandidateInput,
} from "./lib/ranking";
import { normalizeSingaporePhone } from "./lib/phone";
import { sortWorkHistoryByRecency } from "./lib/workHistory";

const candidateDoc = v.object({
  _id: v.id("candidates"),
  _creationTime: v.number(),
  helperPlaceId: v.string(),
  profileUrl: v.string(),
  name: v.string(),
  age: v.optional(v.number()),
  gender: v.optional(v.string()),
  nationality: v.optional(v.string()),
  yearsExperience: v.optional(v.number()),
  contractStatus: v.optional(v.string()),
  presentLocation: v.optional(v.string()),
  availableFrom: v.optional(v.string()),
  availableFromTimestamp: v.optional(v.number()),
  skills: v.array(v.string()),
  languages: v.array(v.string()),
  cookingSkills: v.optional(v.array(v.string())),
  personalityTraits: v.optional(v.array(v.string())),
  hasReferenceLetter: v.boolean(),
  referenceLetterCount: v.number(),
  workHistory: v.array(workHistoryEntry),
  aboutMe: v.optional(v.string()),
  education: v.optional(v.string()),
  salaryExpectation: v.optional(v.string()),
  accommodation: v.optional(v.string()),
  dayOff: v.optional(v.string()),
  phone: v.optional(v.string()),
  whatsapp: v.optional(v.string()),
  rawHtml: v.optional(v.string()),
  scrapedAt: v.number(),
  status: candidateStatus,
  notes: v.optional(v.string()),
  score: v.number(),
  passesHardFilters: v.boolean(),
  filterResults: v.array(filterResult),
  messagedAt: v.optional(v.number()),
  firstSeenAt: v.number(),
  lastSeenAt: v.number(),
});

async function getPreferences(ctx: { db: import("./_generated/server").QueryCtx["db"] }) {
  const prefs = await ctx.db
    .query("preferences")
    .withIndex("by_singleton", (q) => q.eq("singleton", true))
    .unique();

  if (!prefs) {
    throw new Error("Preferences not initialized. Run preferences.get first.");
  }

  return prefs;
}

function mergeHardFilters(
  stored: Partial<typeof DEFAULT_HARD_FILTERS> | undefined,
) {
  return {
    ...DEFAULT_HARD_FILTERS,
    ...stored,
  };
}

function enrichCandidateFields(
  input: {
    availableFrom?: string;
    phone?: string;
    whatsapp?: string;
    [key: string]: unknown;
  },
  prefs: Awaited<ReturnType<typeof getPreferences>>,
) {
  const availableFromTimestamp =
    input.availableFrom !== undefined
      ? parseHelperPlaceDate(input.availableFrom)
      : undefined;

  const phone = normalizeSingaporePhone(input.phone);
  const whatsapp = normalizeSingaporePhone(input.whatsapp ?? input.phone);

  const candidateInput = {
    hasReferenceLetter: input.hasReferenceLetter as boolean,
    referenceLetterCount: input.referenceLetterCount as number,
    availableFrom: input.availableFrom as string | undefined,
    availableFromTimestamp,
    contractStatus: input.contractStatus as string | undefined,
    presentLocation: input.presentLocation as string | undefined,
    languages: input.languages as string[],
    skills: input.skills as string[],
    yearsExperience: input.yearsExperience as number | undefined,
    name: input.name as string,
    age: input.age as number | undefined,
    gender: input.gender as string | undefined,
    nationality: input.nationality as string | undefined,
    aboutMe: input.aboutMe as string | undefined,
    workHistory: input.workHistory as CandidateInput["workHistory"],
  };

  const filterResults = evaluateHardFilters(
    candidateInput,
    mergeHardFilters(prefs.hardFilters),
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

export const list = query({
  args: {
    passesHardFiltersOnly: v.optional(v.boolean()),
    status: v.optional(candidateStatus),
  },
  returns: v.array(candidateDoc),
  handler: async (ctx, args) => {
    let results = await ctx.db.query("candidates").collect();

    if (args.passesHardFiltersOnly) {
      results = results.filter((c) => c.passesHardFilters);
    }
    if (args.status) {
      results = results.filter((c) => c.status === args.status);
    }

    return results.sort((a, b) => b.score - a.score);
  },
});

export const listExcluded = query({
  args: {},
  returns: v.array(candidateDoc),
  handler: async (ctx) => {
    const results = await ctx.db.query("candidates").collect();
    return results
      .filter((c) => !c.passesHardFilters)
      .sort((a, b) => b.score - a.score);
  },
});

export const listNewSince = query({
  args: { since: v.number() },
  returns: v.array(candidateDoc),
  handler: async (ctx, args) => {
    const results = await ctx.db.query("candidates").collect();
    return results
      .filter((c) => c.firstSeenAt >= args.since)
      .sort((a, b) => b.score - a.score);
  },
});

export const updateNotes = mutation({
  args: {
    candidateId: v.id("candidates"),
    notes: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("candidates", args.candidateId, { notes: args.notes });
    return null;
  },
});

export const markMessaged = mutation({
  args: { candidateId: v.id("candidates") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("candidates", args.candidateId, {
      status: "messaged",
      messagedAt: Date.now(),
    });
    return null;
  },
});

export const get = query({
  args: { id: v.id("candidates") },
  returns: v.union(candidateDoc, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get("candidates", args.id);
  },
});

export const listToday = query({
  args: {},
  returns: v.object({
    newSinceLastScrape: v.array(candidateDoc),
    topByScore: v.array(candidateDoc),
    lastScrapeAt: v.optional(v.number()),
    newCount: v.number(),
  }),
  handler: async (ctx) => {
    const latestRun = await ctx.db
      .query("scrapeRuns")
      .withIndex("by_started")
      .order("desc")
      .first();

    const since = latestRun?.startedAt ?? Date.now() - 24 * 60 * 60 * 1000;
    const all = await ctx.db.query("candidates").collect();

    const newSinceLastScrape = all
      .filter((c) => c.firstSeenAt >= since)
      .sort((a, b) => b.score - a.score);

    const topByScore = all
      .filter((c) => c.passesHardFilters)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      newSinceLastScrape,
      topByScore,
      lastScrapeAt: latestRun?.finishedAt,
      newCount: latestRun?.newCount ?? newSinceLastScrape.length,
    };
  },
});

export const listForOutreach = query({
  args: {
    status: v.optional(candidateStatus),
    includeAll: v.optional(v.boolean()),
  },
  returns: v.array(candidateDoc),
  handler: async (ctx, args) => {
    let results = await ctx.db.query("candidates").collect();
    results = results.filter((c) => c.passesHardFilters);

    if (args.includeAll) {
      results = results.filter(
        (c) =>
          c.status === "new" ||
          c.status === "shortlisted" ||
          c.status === "messaged" ||
          c.status === "interviewing",
      );
    } else if (args.status) {
      results = results.filter((c) => c.status === args.status);
    } else {
      results = results.filter((c) => c.status === "shortlisted");
    }

    return results.sort((a, b) => b.score - a.score);
  },
});

export const getById = query({
  args: { candidateId: v.id("candidates") },
  returns: v.union(candidateDoc, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get("candidates", args.candidateId);
  },
});

export const getByHelperPlaceId = query({
  args: { helperPlaceId: v.string() },
  returns: v.union(candidateDoc, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("candidates")
      .withIndex("by_helper_place_id", (q) =>
        q.eq("helperPlaceId", args.helperPlaceId),
      )
      .unique();
  },
});

export const updateStatus = mutation({
  args: {
    candidateId: v.id("candidates"),
    status: candidateStatus,
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get("candidates", args.candidateId);
    if (!candidate) throw new Error("Candidate not found");

    const updates: {
      status: typeof args.status;
      notes?: string;
      messagedAt?: number;
    } = { status: args.status };

    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.status === "messaged" && !candidate.messagedAt) {
      updates.messagedAt = Date.now();
    }

    await ctx.db.patch("candidates", args.candidateId, updates);
    return null;
  },
});

export const recalculateScores = mutation({
  args: {},
  returns: v.object({ updated: v.number() }),
  handler: async (ctx) => {
    const prefs = await getPreferences(ctx);
    const candidates = await ctx.db.query("candidates").collect();
    let updated = 0;

    for (const candidate of candidates) {
      const enriched = enrichCandidateFields(candidate, prefs);
      await ctx.db.patch("candidates", candidate._id, {
        availableFromTimestamp: enriched.availableFromTimestamp,
        phone: enriched.phone,
        whatsapp: enriched.whatsapp,
        workHistory: sortWorkHistoryByRecency(candidate.workHistory),
        filterResults: enriched.filterResults,
        passesHardFilters: enriched.passesHardFilters,
        score: enriched.score,
      });
      updated += 1;
    }

    return { updated };
  },
});
