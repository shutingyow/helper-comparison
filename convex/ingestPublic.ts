import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { candidateIngestValidator } from "./lib/candidateFields";

const scrapeRunInput = v.object({
  startedAt: v.number(),
  finishedAt: v.number(),
  errors: v.optional(v.array(v.string())),
});

export const ingestBatch = mutation({
  args: {
    secret: v.string(),
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
    const expectedSecret = process.env.INGEST_SECRET;
    if (!expectedSecret || args.secret !== expectedSecret) {
      throw new Error("Unauthorized ingest request");
    }

    return await ctx.runMutation(internal.ingest.batch, {
      candidates: args.candidates,
      scrapeRun: args.scrapeRun,
    });
  },
});

/** Used by the scraper to skip already-ingested profiles on daily runs. */
export const listKnownHelperPlaceIds = query({
  args: { secret: v.string() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const expectedSecret = process.env.INGEST_SECRET;
    if (!expectedSecret || args.secret !== expectedSecret) {
      throw new Error("Unauthorized");
    }

    const candidates = await ctx.db.query("candidates").collect();
    return candidates.map((c) => c.helperPlaceId);
  },
});

/** Used by the scraper to backfill phone numbers on incremental runs. */
export const listMissingPhoneHelperPlaceIds = query({
  args: { secret: v.string() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const expectedSecret = process.env.INGEST_SECRET;
    if (!expectedSecret || args.secret !== expectedSecret) {
      throw new Error("Unauthorized");
    }

    const candidates = await ctx.db.query("candidates").collect();
    return candidates.filter((c) => !c.phone).map((c) => c.helperPlaceId);
  },
});
