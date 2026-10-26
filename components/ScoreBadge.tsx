"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { getScoreHints } from "@/lib/scoreHints";
import { cn } from "@/lib/utils";
import type { Candidate } from "@/lib/types";

export function ScoreBadge({
  score,
  candidate,
  size = "md",
  showWhy = true,
}: {
  score?: number;
  candidate?: Candidate;
  size?: "sm" | "md" | "lg";
  /** When false, renders badge only (e.g. dense lists). */
  showWhy?: boolean;
}) {
  const value = score ?? candidate?.score ?? 0;
  /* Accent-tint scale — no competing teal/amber greens */
  const tone =
    value >= 70
      ? "bg-jade-100 text-jade-800"
      : value >= 40
        ? "bg-stone-100 text-stone-700"
        : "bg-stone-50 text-stone-500";

  const badge = (
    <Badge
      className={cn(
        tone,
        size === "lg" && "px-3 py-1 text-sm",
        size === "sm" && "px-2 py-0.5 text-[10px]",
      )}
      title={showWhy ? undefined : "Ranking score"}
    >
      {value}
    </Badge>
  );

  if (!showWhy || !candidate) {
    return badge;
  }

  const hints = getScoreHints(candidate);

  return (
    <Tooltip
      content={
        <div className="space-y-1.5">
          <p className="font-medium text-stone-800">Why this score</p>
          {hints.length > 0 ? (
            <ul className="list-disc space-y-0.5 pl-3.5 text-stone-600">
              {hints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          ) : (
            <p>
              Score reflects reference letters, skill match, experience, and
              start-date fit against your preferences.
            </p>
          )}
        </div>
      }
    >
      {badge}
    </Tooltip>
  );
}
