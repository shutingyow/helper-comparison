import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeSingaporePhone } from "./lib/phone";

const outreachStatus = v.union(
  v.literal("opened"),
  v.literal("sent"),
  v.literal("replied"),
);

const outreachDoc = v.object({
  _id: v.id("outreachMessages"),
  _creationTime: v.number(),
  candidateId: v.id("candidates"),
  templateKey: v.string(),
  renderedText: v.string(),
  toE164: v.string(),
  channel: v.literal("whatsapp"),
  status: outreachStatus,
  openedAt: v.number(),
  sentAt: v.optional(v.number()),
  repliedAt: v.optional(v.number()),
});

export const listByCandidate = query({
  args: { candidateId: v.id("candidates") },
  returns: v.array(outreachDoc),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("outreachMessages")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .collect();
    return messages.sort((a, b) => b.openedAt - a.openedAt);
  },
});

export const getLatestByCandidate = query({
  args: { candidateId: v.id("candidates") },
  returns: v.union(outreachDoc, v.null()),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("outreachMessages")
      .withIndex("by_candidate_opened", (q) =>
        q.eq("candidateId", args.candidateId),
      )
      .order("desc")
      .first();
    return messages ?? null;
  },
});

const latestForCandidate = v.object({
  candidateId: v.id("candidates"),
  latest: v.union(outreachDoc, v.null()),
});

export const getLatestForCandidates = query({
  args: { candidateIds: v.array(v.id("candidates")) },
  returns: v.array(latestForCandidate),
  handler: async (ctx, args) => {
    return await Promise.all(
      args.candidateIds.map(async (candidateId) => {
        const latest = await ctx.db
          .query("outreachMessages")
          .withIndex("by_candidate_opened", (q) =>
            q.eq("candidateId", candidateId),
          )
          .order("desc")
          .first();
        return { candidateId, latest: latest ?? null };
      }),
    );
  },
});

export const recordOpened = mutation({
  args: {
    candidateId: v.id("candidates"),
    templateKey: v.string(),
    renderedText: v.string(),
    toE164: v.string(),
  },
  returns: v.id("outreachMessages"),
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get("candidates", args.candidateId);
    if (!candidate) throw new Error("Candidate not found");

    const normalized = normalizeSingaporePhone(args.toE164);
    if (!normalized) throw new Error("Invalid Singapore phone number");

    const now = Date.now();
    return await ctx.db.insert("outreachMessages", {
      candidateId: args.candidateId,
      templateKey: args.templateKey,
      renderedText: args.renderedText,
      toE164: normalized,
      channel: "whatsapp",
      status: "opened",
      openedAt: now,
    });
  },
});

export const markSent = mutation({
  args: { outreachId: v.id("outreachMessages") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get("outreachMessages", args.outreachId);
    if (!message) throw new Error("Outreach message not found");
    if (message.status === "sent" || message.status === "replied") {
      return null;
    }

    const now = Date.now();
    await ctx.db.patch("outreachMessages", args.outreachId, {
      status: "sent",
      sentAt: now,
    });

    const candidate = await ctx.db.get("candidates", message.candidateId);
    if (candidate && candidate.status !== "messaged") {
      await ctx.db.patch("candidates", message.candidateId, {
        status: "messaged",
        messagedAt: candidate.messagedAt ?? now,
      });
    }

    return null;
  },
});

export const markReplied = mutation({
  args: { outreachId: v.id("outreachMessages") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get("outreachMessages", args.outreachId);
    if (!message) throw new Error("Outreach message not found");

    const now = Date.now();
    await ctx.db.patch("outreachMessages", args.outreachId, {
      status: "replied",
      repliedAt: now,
      sentAt: message.sentAt ?? now,
    });

    return null;
  },
});
