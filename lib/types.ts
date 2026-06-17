import type { Doc, Id } from "@/convex/_generated/dataModel";

export type CandidateStatus =
  | "new"
  | "shortlisted"
  | "messaged"
  | "interviewing"
  | "rejected"
  | "hired";

export type Candidate = Doc<"candidates">;
export type CandidateId = Id<"candidates">;

export interface WorkHistoryEntry {
  period: string;
  title: string;
  location?: string;
  employer: string;
  duties: string;
  hasReferenceLetter: boolean;
}

export interface FilterResult {
  filter: string;
  passed: boolean;
  reason: string;
}

export interface ScoreBreakdown {
  referenceLetters: number;
  desiredSkills: number;
  experience: number;
  startDate: number;
  contractBonus: number;
  completeness: number;
  total: number;
}

export type Preferences = Doc<"preferences">;

export interface HardFilters {
  requireReferenceLetter: boolean;
  requireStartByOct2026: boolean;
  requireFinishedContractOrSingapore: boolean;
  requireEnglish: boolean;
  requireBabyChildCareInRecentWork: boolean;
}

export interface RankingWeights {
  perReferenceLetter: number;
  perDesiredSkill: number;
  perYearExperience: number;
  maxExperienceBonus: number;
  startDateWithinTwoWeeks: number;
  finishedContractSingaporeBonus: number;
  profileCompleteness: number;
}

export interface TodaySummary {
  newSinceLastScrape: Candidate[];
  topByScore: Candidate[];
  lastScrapeAt?: number;
  newCount: number;
}

export type SortField = "score" | "scrapedAt" | "availableFrom";
export type SortOrder = "asc" | "desc";

export type MessageTemplate = "interview_invite" | "reference_request" | "follow_up";

export const STATUS_LABELS: Record<CandidateStatus, string> = {
  new: "New",
  shortlisted: "Shortlisted",
  messaged: "Messaged",
  interviewing: "Interviewing",
  rejected: "Rejected",
  hired: "Hired",
};

export const FILTER_LABELS: Record<string, string> = {
  reference_letter: "Ref Letter",
  ref_letter: "Ref Letter",
  start_date: "Start Date",
  start_by_oct_2026: "Start Date",
  contract_sg: "Contract/SG",
  contract: "Contract/SG",
  finished_contract_or_singapore: "Contract/SG",
  english: "English",
  baby_child_care_recent_work: "Recent Childcare",
};
