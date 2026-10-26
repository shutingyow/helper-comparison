import { getOutreachTrackingStatus } from "@/components/OutreachStatusBadge";
import type { Candidate } from "@/lib/types";
import type { Doc } from "@/convex/_generated/dataModel";

type OutreachMessage = Doc<"outreachMessages">;

/** Curated Inbox filters — ranking-first triage, not full CRM. */
export type InboxFilter =
  | "all"
  | "shortlisted"
  | "messaged"
  | "interview"
  | "fails_hard_filters";

export const INBOX_FILTER_OPTIONS: { value: InboxFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "messaged", label: "Messaged" },
  { value: "interview", label: "Interview" },
  { value: "fails_hard_filters", label: "Failed filters" },
];

export const INBOX_FILTER_LABELS: Record<InboxFilter, string> = Object.fromEntries(
  INBOX_FILTER_OPTIONS.map((o) => [o.value, o.label]),
) as Record<InboxFilter, string>;

export function isInboxFilter(value: string): value is InboxFilter {
  return INBOX_FILTER_OPTIONS.some((o) => o.value === value);
}

function hasBeenMessaged(
  candidate: Candidate,
  latestOutreach: OutreachMessage | null | undefined,
): boolean {
  if (candidate.status === "messaged" || candidate.messagedAt != null) {
    return true;
  }
  const outreachStatus = getOutreachTrackingStatus(latestOutreach);
  return outreachStatus === "sent" || outreachStatus === "replied";
}

function isInInterviewPipeline(candidate: Candidate): boolean {
  return (
    candidate.status === "interview_scheduled" ||
    candidate.status === "interviewing" ||
    candidate.interviewStatus === "scheduled"
  );
}

export function matchesInboxFilter(
  candidate: Candidate,
  filter: InboxFilter,
  latestOutreach?: OutreachMessage | null,
): boolean {
  switch (filter) {
    case "all":
      // Default triage: hide hard-filter failures so score ranking stays useful.
      return candidate.passesHardFilters;
    case "shortlisted":
      return candidate.status === "shortlisted";
    case "messaged":
      // Combines sent + replied outreach states.
      return hasBeenMessaged(candidate, latestOutreach);
    case "interview":
      return isInInterviewPipeline(candidate);
    case "fails_hard_filters":
      return !candidate.passesHardFilters;
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export function filterInboxCandidates(
  candidates: Candidate[],
  filter: InboxFilter,
  latestByCandidate: Map<string, OutreachMessage | null>,
): Candidate[] {
  return candidates.filter((c) =>
    matchesInboxFilter(c, filter, latestByCandidate.get(c._id)),
  );
}
