import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, migrateLegacyDataToUser } from "./lib/auth";

const userDoc = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  tokenIdentifier: v.string(),
  name: v.string(),
  email: v.string(),
  pictureUrl: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

export const current = query({
  args: {},
  returns: v.union(userDoc, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
  },
});

export const store = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (existing) {
      await ctx.db.patch("users", existing._id, {
        name: identity.name ?? existing.name,
        email: identity.email ?? existing.email,
        pictureUrl: identity.pictureUrl ?? existing.pictureUrl,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    const isFirstUser = (await ctx.db.query("users").first()) === null;

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name ?? "User",
      email: identity.email ?? "",
      pictureUrl: identity.pictureUrl,
      createdAt: Date.now(),
    });

    if (isFirstUser) {
      await migrateLegacyDataToUser(ctx, userId);
    }
    return userId;
  },
});

export const requireCurrent = query({
  args: {},
  returns: userDoc,
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});
