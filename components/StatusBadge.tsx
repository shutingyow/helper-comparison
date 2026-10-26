import { Badge } from "@/components/ui/badge";
import type { CandidateStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

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

/** Short pipeline context for tooltips */
const STATUS_PIPELINE_HINT: Record<CandidateStatus, string> = {
  new: "Pipeline: New — not yet shortlisted",
  shortlisted: "Pipeline: Shortlisted — ready for outreach",
  messaged: "Pipeline: Messaged — waiting on reply",
  interview_scheduled: "Pipeline: Interview scheduled",
  interviewing: "Pipeline: Interviewing",
  rejected: "Pipeline: Rejected",
  hired: "Pipeline: Hired",
};

interface StatusBadgeProps {
  status: CandidateStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={statusVariant[status]}
      className={cn(className)}
      title={STATUS_PIPELINE_HINT[status]}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
