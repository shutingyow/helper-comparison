import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { candidateIngestValidator } from "./lib/candidateFields";

const scrapeRunInput = v.object({
  startedAt: v.number(),
  finishedAt: v.number(),
  errors: v.optional(v.array(v.string())),
});

function assertIngestSecret(secret: string): void {
  const expectedSecret = process.env.INGEST_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    throw new Error("Unauthorized ingest request");
  }
}

async function resolveIngestUserId(
  ctx: { db: import("./_generated/server").QueryCtx["db"] },
  userId: Id<"users"> | undefined,
): Promise<Id<"users">> {
  if (userId) {
    const user = await ctx.db.get("users", userId);
    if (!user) {
      throw new Error("Invalid userId for ingest");
    }
    return userId;
  }

  const envUserId = process.env.SCRAPE_USER_ID;
  if (envUserId) {
    const user = await ctx.db.get("users", envUserId as Id<"users">);
    if (user) {
      return user._id;
    }
  }

  throw new Error(
    "No ingest user configured. Set SCRAPE_USER_ID in Convex or pass userId in the ingest payload.",
  );
}

export const ingestBatch = mutation({
  args: {
    secret: v.string(),
    userId: v.optional(v.id("users")),
    candidates: v.array(candidateIngestValidator),
    scrapeRun: scrapeRunInput,
  },
  returns: v.object({
    newCount: v.number(),
    updatedCount: v.number(),
    scrapeRunId: v.id("scrapeRuns"),
  }),
  handler: async (ctx, args): Promise<{
    newCount: number;
    updatedCount: number;
    scrapeRunId: Id<"scrapeRuns">;
  }> => {
    assertIngestSecret(args.secret);
    const userId = await resolveIngestUserId(ctx, args.userId);

    return await ctx.runMutation(internal.ingest.batch, {
      userId,
      candidates: args.candidates,
      scrapeRun: args.scrapeRun,
    });
  },
});

/** Used by the scraper to skip already-ingested profiles on daily runs. */
export const listKnownHelperPlaceIds = query({
  args: {
    secret: v.string(),
    userId: v.optional(v.id("users")),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    assertIngestSecret(args.secret);
    const userId = await resolveIngestUserId(ctx, args.userId);

    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return candidates.map((c) => c.helperPlaceId);
  },
});

const missingPhoneCandidateValidator = v.object({
  helperPlaceId: v.string(),
  profileUrl: v.string(),
});

/** Used by the scraper to backfill phone numbers on incremental runs. */
export const listMissingPhoneHelperPlaceIds = query({
  args: {
    secret: v.string(),
    userId: v.optional(v.id("users")),
  },
  returns: v.array(missingPhoneCandidateValidator),
  handler: async (ctx, args) => {
    assertIngestSecret(args.secret);
    const userId = await resolveIngestUserId(ctx, args.userId);

    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return candidates
      .filter((c) => !c.phone)
      .map((c) => ({
        helperPlaceId: c.helperPlaceId,
        profileUrl: c.profileUrl,
      }));
  },
});
