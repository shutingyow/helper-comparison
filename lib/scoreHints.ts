import { FILTER_LABELS, type Candidate } from "@/lib/types";

/** Human-readable ranking hints when scoreBreakdown is not stored. */
export function getScoreHints(candidate: Candidate): string[] {
  const hints: string[] = [];

  if (candidate.referenceLetterCount > 0) {
    hints.push(
      `${candidate.referenceLetterCount} reference letter${
        candidate.referenceLetterCount === 1 ? "" : "s"
      }`,
    );
  } else if (candidate.hasReferenceLetter) {
    hints.push("Has reference letter");
  }

  if (candidate.yearsExperience != null && candidate.yearsExperience > 0) {
    hints.push(`${candidate.yearsExperience} yrs experience`);
  }

  if (candidate.skills.length > 0) {
    const shown = candidate.skills.slice(0, 3).join(", ");
    const more =
      candidate.skills.length > 3 ? ` (+${candidate.skills.length - 3})` : "";
    hints.push(`Skills: ${shown}${more}`);
  }

  if (candidate.availableFrom) {
    hints.push(`Available ${candidate.availableFrom}`);
  }

  const contract = candidate.contractStatus?.trim();
  const location = candidate.presentLocation?.trim();
  if (contract || location) {
    hints.push([contract, location].filter(Boolean).join(" · "));
  }

  const failed =
    candidate.filterResults?.filter((f) => !f.passed).map((f) => f.reason) ??
    [];
  for (const reason of failed.slice(0, 2)) {
    hints.push(`Filter: ${reason}`);
  }

  return hints;
}

export function getScoreWhySummary(candidate: Candidate): string {
  const hints = getScoreHints(candidate);
  if (hints.length === 0) {
    return "Score reflects refs, skills match, experience, and start date fit.";
  }
  return hints.slice(0, 4).join(" · ");
}

export function getFailedFilterLabels(candidate: Candidate): string[] {
  return (
    candidate.filterResults
      ?.filter((f) => !f.passed)
      .map((f) => FILTER_LABELS[f.filter] ?? f.filter) ?? []
  );
}
