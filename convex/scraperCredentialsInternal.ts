import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

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
