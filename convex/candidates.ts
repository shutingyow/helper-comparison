import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  candidateStatus,
  filterResult,
  interviewStatus,
  interviewType,
  workHistoryEntry,
} from "./schema";
import { getCurrentUser } from "./lib/auth";
import {
  getPreferencesForUser,
  recalculateCandidatesForUser,
  scoreCandidate,
} from "./lib/candidateScoring";

const candidateDoc = v.object({
  _id: v.id("candidates"),
  _creationTime: v.number(),
  userId: v.optional(v.id("users")),
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
  interviewScheduledAt: v.optional(v.number()),
  interviewType: v.optional(interviewType),
  interviewLocationOrLink: v.optional(v.string()),
  interviewStatus: v.optional(interviewStatus),
  interviewNotes: v.optional(v.string()),
  firstSeenAt: v.number(),
  lastSeenAt: v.number(),
});

async function enrichCandidateFields(
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
    workHistory: import("./lib/ranking").CandidateInput["workHistory"];
  },
  prefs: Awaited<ReturnType<typeof getPreferencesForUser>>,
) {
  return scoreCandidate(input, prefs);
}

function belongsToUser(
  candidate: { userId?: import("./_generated/dataModel").Id<"users"> | undefined },
  userId: import("./_generated/dataModel").Id<"users">,
) {
  return !candidate.userId || candidate.userId === userId;
}

async function logCandidateEvent(
  ctx: import("./_generated/server").MutationCtx,
  args: {
    userId: import("./_generated/dataModel").Id<"users">;
    candidateId: import("./_generated/dataModel").Id<"candidates">;
    type: string;
    metadata?: unknown;
  },
) {
  await ctx.db.insert("candidateEvents", {
    userId: args.userId,
    candidateId: args.candidateId,
    type: args.type,
    metadata: args.metadata,
    createdAt: Date.now(),
  });
}

export const list = query({
  args: {
    passesHardFiltersOnly: v.optional(v.boolean()),
    status: v.optional(candidateStatus),
    excludeRejected: v.optional(v.boolean()),
  },
  returns: v.array(candidateDoc),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    let results = await ctx.db
      .query("candidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (args.passesHardFiltersOnly) {
      results = results.filter((c) => c.passesHardFilters);
    }
    if (args.excludeRejected) {
      results = results.filter((c) => c.status !== "rejected");
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
    const user = await getCurrentUser(ctx);
    const results = await ctx.db
      .query("candidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return results
      .filter((c) => !c.passesHardFilters)
      .sort((a, b) => b.score - a.score);
  },
});

export const listNewSince = query({
  args: {
    since: v.number(),
    excludeRejected: v.optional(v.boolean()),
  },
  returns: v.array(candidateDoc),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const results = await ctx.db
      .query("candidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return results
      .filter(
        (c) =>
          c.firstSeenAt >= args.since &&
          (!args.excludeRejected || c.status !== "rejected"),
      )
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
    const user = await getCurrentUser(ctx);
    const candidate = await ctx.db.get("candidates", args.candidateId);
    if (!candidate || !belongsToUser(candidate, user._id)) {
      throw new Error("Candidate not found");
    }
    await ctx.db.patch("candidates", args.candidateId, { notes: args.notes });
    return null;
  },
});

export const markMessaged = mutation({
  args: { candidateId: v.id("candidates") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const candidate = await ctx.db.get("candidates", args.candidateId);
    if (!candidate || !belongsToUser(candidate, user._id)) {
      throw new Error("Candidate not found");
    }
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
    const user = await getCurrentUser(ctx);
    const candidate = await ctx.db.get("candidates", args.id);
    if (!candidate || !belongsToUser(candidate, user._id)) {
      return null;
    }
    return candidate;
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
    const user = await getCurrentUser(ctx);
    const latestRun = await ctx.db
      .query("scrapeRuns")
      .withIndex("by_user_and_started", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    const since = latestRun?.startedAt ?? Date.now() - 24 * 60 * 60 * 1000;
    const all = await ctx.db
      .query("candidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

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
    const user = await getCurrentUser(ctx);
    let results = await ctx.db
      .query("candidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    results = results.filter((c) => c.passesHardFilters);

    if (args.includeAll) {
      results = results.filter(
        (c) =>
          c.status === "new" ||
          c.status === "shortlisted" ||
          c.status === "messaged" ||
          c.status === "interview_scheduled" ||
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
    const user = await getCurrentUser(ctx);
    const candidate = await ctx.db.get("candidates", args.candidateId);
    if (!candidate || !belongsToUser(candidate, user._id)) {
      return null;
    }
    return candidate;
  },
});

export const getByHelperPlaceId = query({
  args: { helperPlaceId: v.string() },
  returns: v.union(candidateDoc, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const candidate = await ctx.db
      .query("candidates")
      .withIndex("by_user_and_helper_place_id", (q) =>
        q.eq("userId", user._id).eq("helperPlaceId", args.helperPlaceId),
      )
      .unique();
    return candidate ?? null;
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
    const user = await getCurrentUser(ctx);
    const candidate = await ctx.db.get("candidates", args.candidateId);
    if (!candidate || !belongsToUser(candidate, user._id)) {
      throw new Error("Candidate not found");
    }

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

export const listUpcomingInterviews = query({
  args: { now: v.number() },
  returns: v.array(candidateDoc),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const sevenDaysLater = args.now + 7 * 24 * 60 * 60 * 1000;
    const results = await ctx.db
      .query("candidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return results
      .filter(
        (c) =>
          c.interviewStatus === "scheduled" &&
          c.interviewScheduledAt != null &&
          c.interviewScheduledAt >= args.now &&
          c.interviewScheduledAt <= sevenDaysLater,
      )
      .sort((a, b) => a.interviewScheduledAt! - b.interviewScheduledAt!);
  },
});

export const scheduleInterview = mutation({
  args: {
    candidateId: v.id("candidates"),
    interviewScheduledAt: v.number(),
    interviewType: interviewType,
    interviewLocationOrLink: v.optional(v.string()),
    interviewNotes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const candidate = await ctx.db.get("candidates", args.candidateId);
    if (!candidate || !belongsToUser(candidate, user._id)) {
      throw new Error("Candidate not found");
    }

    await ctx.db.patch("candidates", args.candidateId, {
      interviewScheduledAt: args.interviewScheduledAt,
      interviewType: args.interviewType,
      interviewLocationOrLink: args.interviewLocationOrLink,
      interviewNotes: args.interviewNotes,
      interviewStatus: "scheduled",
      status: "interview_scheduled",
    });

    await logCandidateEvent(ctx, {
      userId: user._id,
      candidateId: args.candidateId,
      type: "interview_scheduled",
      metadata: {
        interviewScheduledAt: args.interviewScheduledAt,
        interviewType: args.interviewType,
        interviewLocationOrLink: args.interviewLocationOrLink,
      },
    });

    return null;
  },
});

export const updateInterview = mutation({
  args: {
    candidateId: v.id("candidates"),
    interviewScheduledAt: v.optional(v.number()),
    interviewType: v.optional(interviewType),
    interviewLocationOrLink: v.optional(v.string()),
    interviewNotes: v.optional(v.string()),
    interviewStatus: v.optional(interviewStatus),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const candidate = await ctx.db.get("candidates", args.candidateId);
    if (!candidate || !belongsToUser(candidate, user._id)) {
      throw new Error("Candidate not found");
    }

    const updates: {
      interviewScheduledAt?: number;
      interviewType?: typeof args.interviewType;
      interviewLocationOrLink?: string;
      interviewNotes?: string;
      interviewStatus?: typeof args.interviewStatus;
      status?: "interview_scheduled" | "interviewing";
    } = {};

    if (args.interviewScheduledAt !== undefined) {
      updates.interviewScheduledAt = args.interviewScheduledAt;
    }
    if (args.interviewType !== undefined) updates.interviewType = args.interviewType;
    if (args.interviewLocationOrLink !== undefined) {
      updates.interviewLocationOrLink = args.interviewLocationOrLink;
    }
    if (args.interviewNotes !== undefined) updates.interviewNotes = args.interviewNotes;
    if (args.interviewStatus !== undefined) {
      updates.interviewStatus = args.interviewStatus;
      if (args.interviewStatus === "scheduled") {
        updates.status = "interview_scheduled";
      } else if (
        args.interviewStatus === "completed" ||
        args.interviewStatus === "no_show"
      ) {
        updates.status = "interviewing";
      }
    }

    await ctx.db.patch("candidates", args.candidateId, updates);

    if (args.interviewStatus) {
      await logCandidateEvent(ctx, {
        userId: user._id,
        candidateId: args.candidateId,
        type: `interview_${args.interviewStatus}`,
        metadata: updates,
      });
    }

    return null;
  },
});

export const cancelInterview = mutation({
  args: {
    candidateId: v.id("candidates"),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const candidate = await ctx.db.get("candidates", args.candidateId);
    if (!candidate || !belongsToUser(candidate, user._id)) {
      throw new Error("Candidate not found");
    }

    const updates: {
      interviewStatus: "cancelled";
      interviewNotes?: string;
    } = { interviewStatus: "cancelled" };

    if (args.notes !== undefined) updates.interviewNotes = args.notes;

    await ctx.db.patch("candidates", args.candidateId, updates);

    await logCandidateEvent(ctx, {
      userId: user._id,
      candidateId: args.candidateId,
      type: "interview_cancelled",
      metadata: { notes: args.notes },
    });

    return null;
  },
});

export const recalculateScores = mutation({
  args: {},
  returns: v.object({ updated: v.number() }),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const updated = await recalculateCandidatesForUser(ctx, user._id);
    return { updated };
  },
});
