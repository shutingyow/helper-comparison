import { getOutreachTrackingStatus } from "@/components/OutreachStatusBadge";
import { getCandidatePhoneE164 } from "@/lib/whatsapp";
import type { Candidate } from "@/lib/types";
import type { Doc } from "@/convex/_generated/dataModel";

type OutreachMessage = Doc<"outreachMessages">;

export type InboxFilter =
  | "all"
  | "new"
  | "shortlisted"
  | "passes_hard_filters"
  | "fails_hard_filters"
  | "no_phone"
  | "messaged"
  | "replied"
  | "interview_scheduled"
  | "interviewing"
  | "hired";

export const INBOX_FILTER_OPTIONS: { value: InboxFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New / unreviewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "passes_hard_filters", label: "Passes hard filters" },
  { value: "fails_hard_filters", label: "Fails hard filters" },
  { value: "no_phone", label: "No WhatsApp phone" },
  { value: "messaged", label: "Messaged" },
  { value: "replied", label: "Replied (WhatsApp)" },
  { value: "interview_scheduled", label: "Interview scheduled" },
  { value: "interviewing", label: "Interviewing" },
  { value: "hired", label: "Hired" },
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

export function matchesInboxFilter(
  candidate: Candidate,
  filter: InboxFilter,
  latestOutreach?: OutreachMessage | null,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "new":
      return candidate.status === "new";
    case "shortlisted":
      return candidate.status === "shortlisted";
    case "passes_hard_filters":
      return candidate.passesHardFilters;
    case "fails_hard_filters":
      return !candidate.passesHardFilters;
    case "no_phone":
      return !getCandidatePhoneE164(candidate);
    case "messaged":
      return hasBeenMessaged(candidate, latestOutreach);
    case "replied":
      return getOutreachTrackingStatus(latestOutreach) === "replied";
    case "interview_scheduled":
      return (
        candidate.status === "interview_scheduled" ||
        candidate.interviewStatus === "scheduled"
      );
    case "interviewing":
      return candidate.status === "interviewing";
    case "hired":
      return candidate.status === "hired";
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
  if (filter === "all") return candidates;
  return candidates.filter((c) =>
    matchesInboxFilter(c, filter, latestByCandidate.get(c._id)),
  );
}
