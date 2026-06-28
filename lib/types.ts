import type { Doc, Id } from "@/convex/_generated/dataModel";

export type CandidateStatus =
  | "new"
  | "shortlisted"
  | "messaged"
  | "interview_scheduled"
  | "interviewing"
  | "rejected"
  | "hired";

export type InterviewType = "phone" | "video" | "in_person";

export type InterviewStatus = "scheduled" | "completed" | "no_show" | "cancelled";

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
  interview_scheduled: "Interview Scheduled",
  interviewing: "Interviewing",
  rejected: "Rejected",
  hired: "Hired",
};

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  phone: "Phone",
  video: "Video",
  in_person: "In person",
};

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  no_show: "No show",
  cancelled: "Cancelled",
};

export const FILTER_LABELS: Record<string, string> = {
  reference_letter: "Ref Letter",
  ref_letter: "Ref Letter",
  start_date: "Start Date",
  start_by_target_date: "Start Date",
  start_by_oct_2026: "Start Date",
  contract_sg: "Contract/SG",
  contract: "Contract/SG",
  finished_contract_or_singapore: "Contract/SG",
  english: "English",
  baby_child_care_recent_work: "Recent Childcare",
};
