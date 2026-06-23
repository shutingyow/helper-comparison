import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";

const scrapeRunDoc = v.object({
  _id: v.id("scrapeRuns"),
  _creationTime: v.number(),
  userId: v.optional(v.id("users")),
  startedAt: v.number(),
  finishedAt: v.number(),
  newCount: v.number(),
  updatedCount: v.number(),
  errors: v.array(v.string()),
});

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(scrapeRunDoc),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("scrapeRuns")
      .withIndex("by_user_and_started", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const latest = query({
  args: {},
  returns: v.union(scrapeRunDoc, v.null()),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("scrapeRuns")
      .withIndex("by_user_and_started", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
  },
});
