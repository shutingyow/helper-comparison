import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Candidate } from "@/lib/types";
import { formatInterviewWhen } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function InterviewBadge({
  candidate,
  className,
}: {
  candidate: Candidate;
  className?: string;
}) {
  if (
    candidate.interviewStatus !== "scheduled" ||
    candidate.interviewScheduledAt == null
  ) {
    return null;
  }

  return (
    <Badge
      variant="interviewing"
      className={cn("gap-1", className)}
      title={formatInterviewWhen(candidate.interviewScheduledAt)}
    >
      <Calendar className="h-3 w-3" />
      {formatInterviewWhen(candidate.interviewScheduledAt)}
    </Badge>
  );
}
