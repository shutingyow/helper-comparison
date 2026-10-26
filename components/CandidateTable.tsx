"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CandidateCard } from "@/components/CandidateCard";
import { FilterBadges } from "@/components/FilterBadges";
import { ScoreBadge } from "@/components/ScoreBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { InterviewBadge } from "@/components/InterviewBadge";
import type { Candidate } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

type SortField = "score" | "firstSeenAt" | "availableFrom";

export function CandidateTable({
  candidates,
  sortField: controlledSortField,
  sortOrder: controlledSortOrder,
  onSortChange,
  selectedIds,
  onToggleSelect,
  onSelectionChange,
  showCheckbox = false,
  selectable = false,
  showFilters = true,
}: {
  candidates: Candidate[];
  sortField?: SortField;
  sortOrder?: "asc" | "desc";
  onSortChange?: (field: SortField) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectionChange?: (ids: Set<string>) => void;
  showCheckbox?: boolean;
  selectable?: boolean;
  showFilters?: boolean;
}) {
  const [localSortField, setLocalSortField] = useState<SortField>("score");
  const [localSortOrder, setLocalSortOrder] = useState<"asc" | "desc">("desc");

  const sortField = controlledSortField ?? localSortField;
  const sortOrder = controlledSortOrder ?? localSortOrder;
  const isSelectable = selectable || showCheckbox;

  const selection = selectedIds ?? new Set<string>();

  const handleSort = (field: SortField) => {
    if (onSortChange) {
      onSortChange(field);
      return;
    }
    if (field === sortField) {
      setLocalSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setLocalSortField(field);
      setLocalSortOrder("desc");
    }
  };

  const toggleSelect = (id: string) => {
    if (onSelectionChange) {
      const next = new Set(selection);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectionChange(next);
      return;
    }
    onToggleSelect?.(id);
  };

  const sorted = useMemo(() => {
    return [...candidates].sort((a, b) => {
      let cmp = 0;
      if (sortField === "score") cmp = a.score - b.score;
      else if (sortField === "firstSeenAt") cmp = a.firstSeenAt - b.firstSeenAt;
      else cmp = (a.availableFrom ?? "").localeCompare(b.availableFrom ?? "");
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [candidates, sortField, sortOrder]);

  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-sm text-stone-600">
        No candidates yet. Run the scraper or wait for the daily sync.
      </div>
    );
  }

  const sortHint =
    sortField === "score"
      ? `Sorted by score (${sortOrder === "desc" ? "highest first" : "lowest first"})`
      : sortField === "firstSeenAt"
        ? `Sorted by first seen (${sortOrder === "desc" ? "newest first" : "oldest first"})`
        : `Sorted by start date (${sortOrder === "desc" ? "Z–A" : "A–Z"})`;

  const headerBtn = (field: SortField, label: string) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className="font-medium text-stone-700 hover:text-stone-900"
    >
      {label}
      {sortField === field ? (sortOrder === "asc" ? " ↑" : " ↓") : ""}
    </button>
  );

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left">
            <tr>
              {isSelectable && <th className="w-10 px-3 py-3" />}
              <th className="px-4 py-3">{headerBtn("score", "Score")}</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Details</th>
              {showFilters && <th className="px-4 py-3">Filters</th>}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">{headerBtn("availableFrom", "Start")}</th>
              <th className="px-4 py-3">{headerBtn("firstSeenAt", "Seen")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr
                key={c._id}
                className={cn(
                  "border-b border-l-[5px] border-stone-100 last:border-b-0",
                  c.status === "shortlisted"
                    ? "border-l-jade-600 bg-jade-50/60"
                    : "border-l-transparent",
                )}
              >
                {isSelectable && (
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selection.has(c._id)}
                      onChange={() => toggleSelect(c._id)}
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <ScoreBadge score={c.score} candidate={c} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/candidates/${c._id}`}
                      className="font-medium text-jade-800 hover:underline"
                    >
                      {c.name}
                    </Link>
                    {c.status === "new" && (
                      <span
                        className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-jade-800 bg-jade-50 ring-1 ring-inset ring-jade-200"
                        title="New applicant"
                      >
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500">
                    {c.age ? `${c.age}yr` : "—"}
                    {c.nationality ? ` · ${c.nationality}` : ""}
                  </p>
                </td>
                <td className="px-4 py-3 text-stone-600">
                  <p>{c.yearsExperience ?? "—"} yrs exp</p>
                  <p className="text-xs">{c.contractStatus ?? "—"}</p>
                  <p className="text-xs">{c.presentLocation ?? "—"}</p>
                </td>
                {showFilters && (
                  <td className="px-4 py-3">
                    <FilterBadges filters={c.filterResults} />
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={c.status} />
                    <InterviewBadge candidate={c} />
                  </div>
                </td>
                <td className="px-4 py-3 text-stone-600">{c.availableFrom ?? "—"}</td>
                <td className="px-4 py-3 text-stone-600">
                  {formatDate(c.firstSeenAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        <p className="text-xs text-stone-500">{sortHint}</p>
        {sorted.map((c) => (
          <CandidateCard
            key={c._id}
            candidate={c}
            selectable={isSelectable}
            selected={selection.has(c._id)}
            onSelect={() => toggleSelect(c._id)}
          />
        ))}
      </div>
    </>
  );
}
