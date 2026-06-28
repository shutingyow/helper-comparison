import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const listEnabledTargets = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      userId: v.id("users"),
    }),
  ),
  handler: async (ctx) => {
    const all = await ctx.db.query("scraperCredentials").collect();
    return all
      .filter((c) => c.scrapeEnabled && c.encryptedPassword.length > 0)
      .map((c) => ({ userId: c.userId }));
  },
});

export const getByUserId = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      helperPlaceEmail: v.string(),
      encryptedPassword: v.string(),
      applicantsUrl: v.string(),
      scrapeEnabled: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const creds = await ctx.db
      .query("scraperCredentials")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!creds || !creds.scrapeEnabled) return null;

    return {
      helperPlaceEmail: creds.helperPlaceEmail,
      encryptedPassword: creds.encryptedPassword,
      applicantsUrl: creds.applicantsUrl,
      scrapeEnabled: creds.scrapeEnabled,
    };
  },
});
