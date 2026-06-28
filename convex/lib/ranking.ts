export type HardFilters = {
  requireReferenceLetter: boolean;
  requireStartByOct2026: boolean;
  requireFinishedContractOrSingapore: boolean;
  requireEnglish: boolean;
  requireBabyChildCareInRecentWork: boolean;
};

export type RankingWeights = {
  perReferenceLetter: number;
  perDesiredSkill: number;
  perYearExperience: number;
  maxExperienceBonus: number;
  startDateWithinTwoWeeks: number;
  finishedContractSingaporeBonus: number;
  profileCompleteness: number;
};

export type FilterResult = {
  filter: string;
  passed: boolean;
  reason: string;
};

export type CandidateInput = {
  hasReferenceLetter: boolean;
  referenceLetterCount: number;
  availableFrom?: string;
  availableFromTimestamp?: number;
  contractStatus?: string;
  presentLocation?: string;
  languages: string[];
  skills: string[];
  yearsExperience?: number;
  name: string;
  age?: number;
  gender?: string;
  nationality?: string;
  aboutMe?: string;
  workHistory: Array<{
    hasReferenceLetter: boolean;
    duties?: string;
    title?: string;
    employer?: string;
    period?: string;
  }>;
};

import { sortWorkHistoryByRecency } from "./workHistory";
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

/** Default target start date for new accounts: first day of the month 3 months from now. */
export function defaultTargetStartDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3, 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function formatTargetDateLabel(isoDate: string): string | null {
  if (!isoDate.trim()) return null;
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function targetDeadlineMs(targetStartDate: string): number {
  const d = new Date(targetStartDate);
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date(defaultTargetStartDate());
    return new Date(
      fallback.getFullYear(),
      fallback.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    ).getTime();
  }
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
}

function targetStartMs(targetStartDate: string): number {
  const d = new Date(targetStartDate);
  if (Number.isNaN(d.getTime())) {
    return new Date(`${defaultTargetStartDate()}T00:00:00`).getTime();
  }
  return d.getTime();
}

export const DEFAULT_HARD_FILTERS: HardFilters = {
  requireReferenceLetter: true,
  requireStartByOct2026: false,
  requireFinishedContractOrSingapore: true,
  requireEnglish: true,
  // Opt-in: strict check that baby + child care appear in recent job duties.
  requireBabyChildCareInRecentWork: false,
};

/** Fill only missing keys from defaults. Explicit `false` is preserved. */
export function mergeHardFilters(
  stored: Partial<HardFilters> | undefined,
): HardFilters {
  const s = stored ?? {};
  return {
    requireReferenceLetter:
      s.requireReferenceLetter ?? DEFAULT_HARD_FILTERS.requireReferenceLetter,
    requireStartByOct2026:
      s.requireStartByOct2026 ?? DEFAULT_HARD_FILTERS.requireStartByOct2026,
    requireFinishedContractOrSingapore:
      s.requireFinishedContractOrSingapore ??
      DEFAULT_HARD_FILTERS.requireFinishedContractOrSingapore,
    requireEnglish: s.requireEnglish ?? DEFAULT_HARD_FILTERS.requireEnglish,
    requireBabyChildCareInRecentWork:
      s.requireBabyChildCareInRecentWork ??
      DEFAULT_HARD_FILTERS.requireBabyChildCareInRecentWork,
  };
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  perReferenceLetter: 15,
  perDesiredSkill: 10,
  perYearExperience: 2,
  maxExperienceBonus: 20,
  startDateWithinTwoWeeks: 20,
  finishedContractSingaporeBonus: 10,
  profileCompleteness: 5,
};

export const DEFAULT_DESIRED_SKILLS = [
  "Baby Care",
  "Child Care",
  "Housekeeping",
  "Cooking",
];

/** Skills that must appear in recent work history, not just the profile skills list. */
export const WORK_VERIFIED_SKILLS = ["Baby Care", "Child Care"] as const;

const BABY_CARE_PATTERNS = [
  /baby\s*care/i,
  /\bbaby\b/i,
  /\binfant/i,
  /\bnewborn/i,
];

const CHILD_CARE_PATTERNS = [
  /child\s*care/i,
  /childcare/i,
  /\bchildren\b/i,
  /\bchild\b/i,
  /\bkids\b/i,
  /\btoddler/i,
];

function workEntrySearchText(entry: {
  duties?: string;
  title?: string;
  employer?: string;
}): string {
  return [entry.duties, entry.title, entry.employer].filter(Boolean).join(" ");
}

function textMatchesPatterns(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function hasBabyCareInWorkEntry(entry: {
  duties?: string;
  title?: string;
  employer?: string;
}): boolean {
  return textMatchesPatterns(workEntrySearchText(entry), BABY_CARE_PATTERNS);
}

function hasChildCareInWorkEntry(entry: {
  duties?: string;
  title?: string;
  employer?: string;
}): boolean {
  return textMatchesPatterns(workEntrySearchText(entry), CHILD_CARE_PATTERNS);
}

export function getRecentWorkHistory(
  workHistory: CandidateInput["workHistory"],
  count = 2,
): CandidateInput["workHistory"] {
  const withPeriod = workHistory.map((entry) => ({
    ...entry,
    period: entry.period ?? "",
  }));
  return sortWorkHistoryByRecency(withPeriod).slice(0, count);
}

export function hasBabyCareInRecentWork(
  workHistory: CandidateInput["workHistory"],
): boolean {
  return getRecentWorkHistory(workHistory).some(hasBabyCareInWorkEntry);
}

export function hasChildCareInRecentWork(
  workHistory: CandidateInput["workHistory"],
): boolean {
  return getRecentWorkHistory(workHistory).some(hasChildCareInWorkEntry);
}

function skillRequiresWorkVerification(skill: string): boolean {
  return WORK_VERIFIED_SKILLS.some(
    (verified) => verified.toLowerCase() === skill.toLowerCase(),
  );
}

function candidateHasSkill(
  candidate: CandidateInput,
  skill: string,
): boolean {
  if (skillRequiresWorkVerification(skill)) {
    if (/baby/i.test(skill)) {
      return hasBabyCareInRecentWork(candidate.workHistory);
    }
    if (/child/i.test(skill)) {
      return hasChildCareInRecentWork(candidate.workHistory);
    }
    return false;
  }

  return candidate.skills.some(
    (s) => s.toLowerCase() === skill.toLowerCase(),
  );
}

function includesEnglish(languages: string[]): boolean {
  return languages.some((lang) => /english/i.test(lang));
}

function isFinishedContractOrSingapore(
  contractStatus?: string,
  presentLocation?: string,
): boolean {
  const contractOk = contractStatus
    ? /finished contract/i.test(contractStatus)
    : false;
  const locationOk = presentLocation
    ? /singapore/i.test(presentLocation)
    : false;
  return contractOk || locationOk;
}

function passesStartByTarget(
  availableFromTimestamp: number | undefined,
  availableFrom: string | undefined,
  targetStartDate: string,
): { passed: boolean; reason: string } {
  const deadline = targetDeadlineMs(targetStartDate);
  if (availableFromTimestamp !== undefined) {
    const passed = availableFromTimestamp <= deadline;
    return {
      passed,
      reason: passed
        ? `Available from ${availableFrom ?? "parsed date"} (on or before target ${targetStartDate})`
        : `Available from ${availableFrom ?? "parsed date"} (after target ${targetStartDate})`,
    };
  }
  if (!availableFrom) {
    return { passed: false, reason: "Start date unknown — needs manual review" };
  }
  return {
    passed: false,
    reason: `Could not parse start date: "${availableFrom}"`,
  };
}

export function evaluateHardFilters(
  candidate: CandidateInput,
  filters: HardFilters,
  targetStartDate: string = defaultTargetStartDate(),
): FilterResult[] {
  const results: FilterResult[] = [];

  if (filters.requireReferenceLetter) {
    const passed = candidate.hasReferenceLetter;
    results.push({
      filter: "reference_letter",
      passed,
      reason: passed
        ? `${candidate.referenceLetterCount} reference letter(s) on profile`
        : "No reference letter listed in work history",
    });
  }

  if (filters.requireStartByOct2026) {
    const { passed, reason } = passesStartByTarget(
      candidate.availableFromTimestamp,
      candidate.availableFrom,
      targetStartDate,
    );
    results.push({
      filter: "start_by_target_date",
      passed,
      reason,
    });
  }

  if (filters.requireFinishedContractOrSingapore) {
    const passed = isFinishedContractOrSingapore(
      candidate.contractStatus,
      candidate.presentLocation,
    );
    results.push({
      filter: "finished_contract_or_singapore",
      passed,
      reason: passed
        ? `Contract: ${candidate.contractStatus ?? "n/a"}, Location: ${candidate.presentLocation ?? "n/a"}`
        : `Needs finished contract or present in Singapore (contract: ${candidate.contractStatus ?? "n/a"}, location: ${candidate.presentLocation ?? "n/a"})`,
    });
  }

  if (filters.requireEnglish) {
    const passed = includesEnglish(candidate.languages);
    results.push({
      filter: "english",
      passed,
      reason: passed
        ? `Speaks: ${candidate.languages.join(", ")}`
        : `No English listed (languages: ${candidate.languages.join(", ") || "none"})`,
    });
  }

  if (filters.requireBabyChildCareInRecentWork) {
    const babyInRecent = hasBabyCareInRecentWork(candidate.workHistory);
    const childInRecent = hasChildCareInRecentWork(candidate.workHistory);
    const babyInSkills = candidate.skills.some((s) => /baby\s*care/i.test(s));
    const childInSkills = candidate.skills.some((s) => /child\s*care/i.test(s));
    const passed = babyInRecent && childInRecent;
    const recentJobs = getRecentWorkHistory(candidate.workHistory)
      .map((job) => job.period ?? "recent job")
      .join(", ");

    results.push({
      filter: "baby_child_care_recent_work",
      passed,
      reason: passed
        ? `Baby care and child care in recent work (${recentJobs || "top 2 jobs"})`
        : [
            !babyInRecent
              ? babyInSkills
                ? "Baby care listed in skills but not in most recent 2 jobs"
                : "No baby care in most recent 2 jobs"
              : null,
            !childInRecent
              ? childInSkills
                ? "Child care listed in skills but not in most recent 2 jobs"
                : "No child care in most recent 2 jobs"
              : null,
          ]
            .filter(Boolean)
            .join("; "),
    });
  }

  return results;
}

export function passesAllHardFilters(results: FilterResult[]): boolean {
  return results.every((r) => r.passed);
}

export function computeScore(
  candidate: CandidateInput,
  weights: RankingWeights,
  desiredSkills: string[],
  targetStartDate: string = defaultTargetStartDate(),
): number {
  let score = 0;

  score += Math.min(
    candidate.referenceLetterCount * weights.perReferenceLetter,
    weights.perReferenceLetter * 3,
  );

  for (const skill of desiredSkills) {
    if (candidateHasSkill(candidate, skill)) {
      score += weights.perDesiredSkill;
    }
  }

  if (candidate.yearsExperience !== undefined) {
    score += Math.min(
      candidate.yearsExperience * weights.perYearExperience,
      weights.maxExperienceBonus,
    );
  }

  if (candidate.availableFromTimestamp !== undefined) {
    const diff = Math.abs(
      candidate.availableFromTimestamp - targetStartMs(targetStartDate),
    );
    if (diff <= TWO_WEEKS_MS) {
      score += weights.startDateWithinTwoWeeks;
    }
  }

  if (
    isFinishedContractOrSingapore(
      candidate.contractStatus,
      candidate.presentLocation,
    )
  ) {
    score += weights.finishedContractSingaporeBonus;
  }

  const completenessFields = [
    candidate.name,
    candidate.age,
    candidate.gender,
    candidate.nationality,
    candidate.aboutMe,
    candidate.yearsExperience,
    candidate.skills.length > 0,
    candidate.workHistory.length > 0,
  ];
  const filled = completenessFields.filter(Boolean).length;
  if (filled >= 6) score += weights.profileCompleteness;

  return Math.round(score);
}

const HELPERPLACE_MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

export function parseHelperPlaceDate(dateStr: string): number | undefined {
  const cleaned = dateStr.trim();
  const match = cleaned.match(
    /(?:(\d{1,2})\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
  );
  if (!match) return undefined;
  const day = match[1] ? parseInt(match[1], 10) : 1;
  const month = HELPERPLACE_MONTHS[match[2].toLowerCase().slice(0, 3)];
  const year = parseInt(match[3], 10);
  if (month === undefined) return undefined;
  return new Date(year, month, day).getTime();
}
