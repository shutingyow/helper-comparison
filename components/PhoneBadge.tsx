import { Badge } from "@/components/ui/badge";
import { getPhoneValidity } from "@/lib/phone";
import type { Candidate } from "@/lib/types";

export function PhoneBadge({ candidate }: { candidate: Candidate }) {
  const raw = candidate.whatsapp ?? candidate.phone;
  const validity = getPhoneValidity(raw);

  if (validity === "missing") {
    return (
      <Badge variant="outline" className="border-stone-200 bg-stone-50 text-stone-600">
        No phone
      </Badge>
    );
  }

  if (validity === "invalid") {
    return (
      <Badge variant="outline" className="border-stone-300 bg-stone-100 text-stone-600">
        Invalid phone
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-jade-200 bg-jade-50 text-jade-800">
      WhatsApp ready
    </Badge>
  );
}
