import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Candidate } from "@/lib/types";

export function ScoreBadge({
  score,
  candidate,
  size = "md",
}: {
  score?: number;
  candidate?: Candidate;
  size?: "sm" | "md" | "lg";
}) {
  const value = score ?? candidate?.score ?? 0;
  const tone =
    value >= 70
      ? "bg-teal-100 text-teal-800"
      : value >= 40
        ? "bg-amber-100 text-amber-800"
        : "bg-zinc-100 text-zinc-700";

  return (
    <Badge
      className={cn(
        tone,
        size === "lg" && "px-3 py-1 text-sm",
        size === "sm" && "px-2 py-0.5 text-[10px]",
      )}
      title="Ranking score"
    >
      {value}
    </Badge>
  );
}
