import { action, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";
import { decryptSecret, encryptSecret } from "./lib/encryption";

const credentialsPublic = v.object({
  _id: v.id("scraperCredentials"),
  helperPlaceEmail: v.string(),
  applicantsUrl: v.string(),
  hasPassword: v.boolean(),
  lastScrapeAt: v.optional(v.number()),
  scrapeEnabled: v.boolean(),
  updatedAt: v.number(),
});

const HELPERPLACE_APPLICANTS_PATTERN =
  /^https:\/\/(www\.)?helperplace\.com\/.+/i;

function isBrowseCatalogPath(pathname: string): boolean {
  const path = pathname.toLowerCase().replace(/\/$/, "") || "/";
  if (
    path.includes("/applicant") ||
    path.includes("/application") ||
    path.includes("/applications")
  ) {
    return false;
  }
  return (
    path === "/find-candidate" ||
    path === "/find-candidate-singapore" ||
    /^\/find-candidate-[^/]+$/.test(path)
  );
}

function validateApplicantsUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Applicants URL must be a valid https URL");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Applicants URL must use https");
  }
  if (!HELPERPLACE_APPLICANTS_PATTERN.test(url)) {
    throw new Error("Applicants URL must be a HelperPlace page URL");
  }
  if (isBrowseCatalogPath(parsed.pathname)) {
    throw new Error(
      "Applicants URL must be your job applicants list (path should include /applicant), " +
        "not the public candidate catalog (e.g. /find-candidate).",
    );
  }
}

export const getForCurrentUser = query({
  args: {},
  returns: v.union(credentialsPublic, v.null()),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const creds = await ctx.db
      .query("scraperCredentials")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!creds) return null;

    return {
      _id: creds._id,
      helperPlaceEmail: creds.helperPlaceEmail,
      applicantsUrl: creds.applicantsUrl,
      hasPassword: creds.encryptedPassword.length > 0,
      lastScrapeAt: creds.lastScrapeAt,
      scrapeEnabled: creds.scrapeEnabled,
      updatedAt: creds.updatedAt,
    };
  },
});

export const save = mutation({
  args: {
    helperPlaceEmail: v.string(),
    password: v.optional(v.string()),
    applicantsUrl: v.string(),
    scrapeEnabled: v.optional(v.boolean()),
  },
  returns: v.id("scraperCredentials"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const email = args.helperPlaceEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      throw new Error("Enter a valid HelperPlace email address");
    }

    validateApplicantsUrl(args.applicantsUrl.trim());

    const existing = await ctx.db
      .query("scraperCredentials")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    let encryptedPassword = existing?.encryptedPassword ?? "";
    if (args.password !== undefined && args.password.length > 0) {
      encryptedPassword = await encryptSecret(args.password);
    } else if (!existing) {
      throw new Error("Password is required when saving credentials for the first time");
    }

    const now = Date.now();
    const fields = {
      userId: user._id,
      helperPlaceEmail: email,
      encryptedPassword,
      applicantsUrl: args.applicantsUrl.trim(),
      scrapeEnabled: args.scrapeEnabled ?? true,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch("scraperCredentials", existing._id, fields);
      return existing._id;
    }

    return await ctx.db.insert("scraperCredentials", fields);
  },
});

export const listScrapeTargetsWithSecret = action({
  args: {
    secret: v.string(),
  },
  returns: v.array(
    v.object({
      userId: v.id("users"),
    }),
  ),
  handler: async (ctx, args): Promise<Array<{ userId: import("./_generated/dataModel").Id<"users"> }>> => {
    const expectedSecret = process.env.INGEST_SECRET;
    if (!expectedSecret || args.secret !== expectedSecret) {
      throw new Error("Unauthorized");
    }

    return await ctx.runQuery(internal.scraperCredentialsInternal.listEnabledTargets, {});
  },
});

export const getDecryptedForScraperWithSecret = action({
  args: {
    secret: v.string(),
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      helperPlaceEmail: v.string(),
      helperPlacePassword: v.string(),
      applicantsUrl: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args): Promise<{
    helperPlaceEmail: string;
    helperPlacePassword: string;
    applicantsUrl: string;
  } | null> => {
    const expectedSecret = process.env.INGEST_SECRET;
    if (!expectedSecret || args.secret !== expectedSecret) {
      throw new Error("Unauthorized");
    }

    const creds = await ctx.runQuery(internal.scraperCredentialsInternal.getByUserId, {
      userId: args.userId,
    });

    if (!creds) return null;

    const helperPlacePassword = await decryptSecret(creds.encryptedPassword);

    return {
      helperPlaceEmail: creds.helperPlaceEmail,
      helperPlacePassword,
      applicantsUrl: creds.applicantsUrl,
    };
  },
});
