import { Badge } from "@/components/ui/badge";
import type { Doc } from "@/convex/_generated/dataModel";

type OutreachMessage = Doc<"outreachMessages">;
export type OutreachTrackingStatus = OutreachMessage["status"] | "not_contacted";

export const OUTREACH_STATUS_LABELS: Record<OutreachTrackingStatus, string> = {
  not_contacted: "Not contacted",
  opened: "Opened",
  sent: "Sent",
  replied: "Replied",
};

const OUTREACH_STATUS_STYLES: Record<OutreachTrackingStatus, string> = {
  not_contacted: "border-stone-200 bg-stone-50 text-stone-600",
  opened: "border-jade-100 bg-jade-50 text-jade-800",
  sent: "border-stone-200 bg-stone-100 text-stone-700",
  replied: "border-jade-200 bg-jade-100 text-jade-800",
};

export function getOutreachTrackingStatus(
  latest: OutreachMessage | null | undefined,
): OutreachTrackingStatus {
  return latest?.status ?? "not_contacted";
}

export function OutreachStatusBadge({
  latest,
}: {
  latest: OutreachMessage | null | undefined;
}) {
  const status = getOutreachTrackingStatus(latest);

  return (
    <Badge variant="outline" className={OUTREACH_STATUS_STYLES[status]}>
      {OUTREACH_STATUS_LABELS[status]}
    </Badge>
  );
}
