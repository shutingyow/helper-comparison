"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CandidateCard } from "@/components/CandidateCard";
import { FilterBadges } from "@/components/FilterBadges";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Badge } from "@/components/ui/badge";
import { InterviewBadge } from "@/components/InterviewBadge";
import { STATUS_LABELS, type Candidate } from "@/lib/types";
import { formatDate } from "@/lib/utils";

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
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-sm text-zinc-600">
        No candidates yet. Run the scraper or wait for the daily sync.
      </div>
    );
  }

  const headerBtn = (field: SortField, label: string) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className="font-medium text-zinc-700 hover:text-zinc-900"
    >
      {label}
      {sortField === field ? (sortOrder === "asc" ? " ↑" : " ↓") : ""}
    </button>
  );

  return (
    <>
    <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm md:block">
      <table className="min-w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
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
            <tr key={c._id} className="border-b border-zinc-100 last:border-0">
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
                <ScoreBadge score={c.score} />
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/candidates/${c._id}`}
                  className="font-medium text-teal-800 hover:underline"
                >
                  {c.name}
                </Link>
                <p className="text-xs text-zinc-500">
                  {c.age ? `${c.age}yr` : "—"}
                  {c.nationality ? ` · ${c.nationality}` : ""}
                </p>
              </td>
              <td className="px-4 py-3 text-zinc-600">
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
                  <Badge variant={c.status}>{STATUS_LABELS[c.status]}</Badge>
                  <InterviewBadge candidate={c} />
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-600">{c.availableFrom ?? "—"}</td>
              <td className="px-4 py-3 text-zinc-600">
                {formatDate(c.firstSeenAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="space-y-3 md:hidden">
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
