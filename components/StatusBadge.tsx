import { Badge } from "@/components/ui/badge";
import type { CandidateStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const statusVariant: Record<
  CandidateStatus,
  | "new"
  | "shortlisted"
  | "messaged"
  | "interview_scheduled"
  | "interviewing"
  | "rejected"
  | "hired"
> = {
  new: "new",
  shortlisted: "shortlisted",
  messaged: "messaged",
  interview_scheduled: "interview_scheduled",
  interviewing: "interviewing",
  rejected: "rejected",
  hired: "hired",
};

interface StatusBadgeProps {
  status: CandidateStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={statusVariant[status]} className={className}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
