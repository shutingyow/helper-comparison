import { Badge } from "@/components/ui/badge";
import type { CandidateStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  /** When true, show "New". Lists hide it so score stays the visual hero. */
  showNew?: boolean;
}

/**
 * Quiet pipeline label — stone outlines; accent only for shortlisted/hired.
 * Returns null for "new" unless showNew is set.
 */
export function StatusBadge({ status, className, showNew = false }: StatusBadgeProps) {
  if (status === "new" && !showNew) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-normal text-stone-600 border-stone-200",
        status === "shortlisted" && "border-jade-200 bg-jade-50 text-jade-800",
        status === "rejected" && "text-stone-400",
        status === "hired" && "border-jade-200 bg-jade-50 text-jade-800",
        className,
      )}
      title={STATUS_PIPELINE_HINT[status]}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
