import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("scrapeRuns"),
        _creationTime: v.number(),
        startedAt: v.number(),
        finishedAt: v.number(),
        newCount: v.number(),
        updatedCount: v.number(),
        errors: v.array(v.string()),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scrapeRuns")
      .withIndex("by_started")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const latest = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("scrapeRuns"),
      _creationTime: v.number(),
      startedAt: v.number(),
      finishedAt: v.number(),
      newCount: v.number(),
      updatedCount: v.number(),
      errors: v.array(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    return await ctx.db
      .query("scrapeRuns")
      .withIndex("by_started")
      .order("desc")
      .first();
  },
});
