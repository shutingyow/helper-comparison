import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (!user) {
    throw new Error("User not found — refresh the page to finish sign-in setup");
  }

  return user;
}

export async function getCurrentUserOrNull(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

export async function migrateLegacyDataToUser(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  const candidates = await ctx.db.query("candidates").collect();
  for (const candidate of candidates) {
    if (!candidate.userId) {
      await ctx.db.patch("candidates", candidate._id, { userId });
    }
  }

  const prefs = await ctx.db.query("preferences").collect();
  for (const pref of prefs) {
    if (!pref.userId) {
      await ctx.db.patch("preferences", pref._id, { userId });
    }
  }

  const runs = await ctx.db.query("scrapeRuns").collect();
  for (const run of runs) {
    if (!run.userId) {
      await ctx.db.patch("scrapeRuns", run._id, { userId });
    }
  }

  const messages = await ctx.db.query("outreachMessages").collect();
  for (const message of messages) {
    if (!message.userId) {
      await ctx.db.patch("outreachMessages", message._id, { userId });
    }
  }
}
