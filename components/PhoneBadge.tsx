import { Badge } from "@/components/ui/badge";
import { getPhoneValidity } from "@/lib/phone";
import type { Candidate } from "@/lib/types";

export function PhoneBadge({ candidate }: { candidate: Candidate }) {
  const raw = candidate.whatsapp ?? candidate.phone;
  const validity = getPhoneValidity(raw);

  if (validity === "missing") {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
        No phone
      </Badge>
    );
  }

  if (validity === "invalid") {
    return (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800">
        Invalid phone
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
      WhatsApp ready
    </Badge>
  );
}
