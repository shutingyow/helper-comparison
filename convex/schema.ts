import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const candidateStatus = v.union(
  v.literal("new"),
  v.literal("shortlisted"),
  v.literal("messaged"),
  v.literal("interviewing"),
  v.literal("rejected"),
  v.literal("hired"),
);

export const workHistoryEntry = v.object({
  period: v.string(),
  title: v.string(),
  location: v.optional(v.string()),
  employer: v.string(),
  duties: v.string(),
  hasReferenceLetter: v.boolean(),
});

export const filterResult = v.object({
  filter: v.string(),
  passed: v.boolean(),
  reason: v.string(),
});

export default defineSchema({
  candidates: defineTable({
    helperPlaceId: v.string(),
    profileUrl: v.string(),
    name: v.string(),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    nationality: v.optional(v.string()),
    yearsExperience: v.optional(v.number()),
    contractStatus: v.optional(v.string()),
    presentLocation: v.optional(v.string()),
    availableFrom: v.optional(v.string()),
    availableFromTimestamp: v.optional(v.number()),
    skills: v.array(v.string()),
    languages: v.array(v.string()),
    cookingSkills: v.optional(v.array(v.string())),
    personalityTraits: v.optional(v.array(v.string())),
    hasReferenceLetter: v.boolean(),
    referenceLetterCount: v.number(),
    workHistory: v.array(workHistoryEntry),
    aboutMe: v.optional(v.string()),
    education: v.optional(v.string()),
    salaryExpectation: v.optional(v.string()),
    accommodation: v.optional(v.string()),
    dayOff: v.optional(v.string()),
    phone: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    rawHtml: v.optional(v.string()),
    scrapedAt: v.number(),
    status: candidateStatus,
    notes: v.optional(v.string()),
    score: v.number(),
    passesHardFilters: v.boolean(),
    filterResults: v.array(filterResult),
    messagedAt: v.optional(v.number()),
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index("by_helper_place_id", ["helperPlaceId"])
    .index("by_score", ["score"])
    .index("by_status", ["status"])
    .index("by_first_seen", ["firstSeenAt"])
    .index("by_passes_filters", ["passesHardFilters"]),

  scrapeRuns: defineTable({
    startedAt: v.number(),
    finishedAt: v.number(),
    newCount: v.number(),
    updatedCount: v.number(),
    errors: v.array(v.string()),
  }).index("by_started", ["startedAt"]),

  outreachMessages: defineTable({
    candidateId: v.id("candidates"),
    templateKey: v.string(),
    renderedText: v.string(),
    toE164: v.string(),
    channel: v.literal("whatsapp"),
    status: v.union(
      v.literal("opened"),
      v.literal("sent"),
      v.literal("replied"),
    ),
    openedAt: v.number(),
    sentAt: v.optional(v.number()),
    repliedAt: v.optional(v.number()),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_candidate_opened", ["candidateId", "openedAt"]),

  preferences: defineTable({
    singleton: v.literal(true),
    hardFilters: v.object({
      requireReferenceLetter: v.boolean(),
      requireStartByOct2026: v.boolean(),
      requireFinishedContractOrSingapore: v.boolean(),
      requireEnglish: v.boolean(),
      requireBabyChildCareInRecentWork: v.optional(v.boolean()),
    }),
    rankingWeights: v.object({
      perReferenceLetter: v.number(),
      perDesiredSkill: v.number(),
      perYearExperience: v.number(),
      maxExperienceBonus: v.number(),
      startDateWithinTwoWeeks: v.number(),
      finishedContractSingaporeBonus: v.number(),
      profileCompleteness: v.number(),
    }),
    desiredSkills: v.array(v.string()),
    targetStartDate: v.string(),
  }).index("by_singleton", ["singleton"]),
});
