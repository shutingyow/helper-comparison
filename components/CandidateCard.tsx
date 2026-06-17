"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { FilterBadges } from "@/components/FilterBadges";
import type { Candidate } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CandidateCardProps {
  candidate: Candidate;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
  className?: string;
}

export function CandidateCard({
  candidate,
  selectable,
  selected,
  onSelect,
  compact,
  className,
}: CandidateCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {selectable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="mt-1 rounded border-stone-300"
            aria-label={`Select ${candidate.name}`}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                href={`/candidates/${candidate._id}`}
                className="font-semibold text-stone-900 hover:text-coral-700"
              >
                {candidate.name}
              </Link>
              {!compact && (
                <p className="text-xs text-stone-500">
                  {[candidate.nationality, candidate.yearsExperience != null && `${candidate.yearsExperience} yrs exp`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
            <ScoreBadge score={candidate.score} candidate={candidate} size="sm" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={candidate.status} />
            {!compact && candidate.availableFrom && (
              <span className="text-xs text-stone-500">
                From {candidate.availableFrom}
              </span>
            )}
          </div>
          {!candidate.passesHardFilters && (
            <FilterBadges filterResults={candidate.filterResults} className="mt-2" />
          )}
        </div>
      </div>
    </div>
  );
}
