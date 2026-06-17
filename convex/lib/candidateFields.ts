import { v } from "convex/values";
import { workHistoryEntry } from "../schema";

export const candidateIngestFields = {
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
  scrapedAt: v.optional(v.number()),
};

export const candidateIngestValidator = v.object(candidateIngestFields);
