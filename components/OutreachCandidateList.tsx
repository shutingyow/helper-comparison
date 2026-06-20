"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PhoneBadge } from "@/components/PhoneBadge";
import {
  getOutreachTrackingStatus,
  OutreachStatusBadge,
  type OutreachTrackingStatus,
} from "@/components/OutreachStatusBadge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLatestOutreachBatch } from "@/hooks/useOutreach";
import { getCandidatePhoneE164 } from "@/lib/whatsapp";
import { STATUS_LABELS, type Candidate } from "@/lib/types";
import type { Doc } from "@/convex/_generated/dataModel";

type OutreachMessage = Doc<"outreachMessages">;

export type PipelineFilter = "shortlisted" | "new" | "messaged" | "all";
export type PhoneFilter = "ready" | "all";
export type OutreachFilter = "all" | OutreachTrackingStatus;

function sortCandidates(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort((a, b) => {
    const aPhone = getCandidatePhoneE164(a) ? 1 : 0;
    const bPhone = getCandidatePhoneE164(b) ? 1 : 0;
    if (aPhone !== bPhone) return bPhone - aPhone;
    return b.score - a.score;
  });
}

export function OutreachCandidateList({
  candidates,
  selectedIds,
  onSelectionChange,
  phoneFilter,
  outreachFilter,
}: {
  candidates: Candidate[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  phoneFilter: PhoneFilter;
  outreachFilter: OutreachFilter;
}) {
  const candidateIds = useMemo(() => candidates.map((c) => c._id), [candidates]);
  const latestBatch = useLatestOutreachBatch(candidateIds);

  const latestByCandidate = useMemo(() => {
    const map = new Map<string, OutreachMessage | null>();
    for (const row of latestBatch ?? []) {
      map.set(row.candidateId, row.latest);
    }
    return map;
  }, [latestBatch]);

  const filtered = useMemo(() => {
    let list = sortCandidates(candidates);

    if (phoneFilter === "ready") {
      list = list.filter((c) => getCandidatePhoneE164(c));
    }

    if (outreachFilter !== "all") {
      list = list.filter(
        (c) => getOutreachTrackingStatus(latestByCandidate.get(c._id)) === outreachFilter,
      );
    }

    return list;
  }, [candidates, phoneFilter, outreachFilter, latestByCandidate]);

  const readyIds = filtered.filter((c) => getCandidatePhoneE164(c)).map((c) => c._id);
  const allSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c._id));

  function toggleAll() {
    if (allSelected) {
      onSelectionChange(new Set());
      return;
    }
    onSelectionChange(new Set(filtered.map((c) => c._id)));
  }

  function selectReadyOnly() {
    onSelectionChange(new Set(readyIds));
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-sm text-stone-600">
        No candidates match this filter. Try another pipeline stage or shortlist
        candidates from the inbox.
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-sm text-stone-600">
        No candidates match your phone or outreach filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-stone-500">
          {filtered.length} candidate{filtered.length !== 1 ? "s" : ""}
          {phoneFilter === "ready" ? " with valid phones" : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {readyIds.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={selectReadyOnly}>
              Select {readyIds.length} ready
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
            {allSelected ? "Clear selection" : "Select all shown"}
          </Button>
        </div>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left">
            <tr>
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 font-medium text-stone-700">Score</th>
              <th className="px-4 py-3 font-medium text-stone-700">Candidate</th>
              <th className="px-4 py-3 font-medium text-stone-700">Phone</th>
              <th className="px-4 py-3 font-medium text-stone-700">Outreach</th>
              <th className="px-4 py-3 font-medium text-stone-700">Pipeline</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const latest = latestByCandidate.get(c._id);
              const hasPhone = Boolean(getCandidatePhoneE164(c));

              return (
                <tr
                  key={c._id}
                  className={`border-b border-stone-100 last:border-0 ${
                    selectedIds.has(c._id) ? "bg-coral-50/40" : ""
                  }`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c._id)}
                      onChange={() => toggleOne(c._id)}
                      aria-label={`Select ${c.name}`}
                    />
                  </td>
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
                    <p className="text-xs text-stone-500">
                      {c.nationality ?? "—"}
                      {c.yearsExperience != null ? ` · ${c.yearsExperience} yrs` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <PhoneBadge candidate={c} />
                    {!hasPhone && (
                      <p className="mt-1 text-xs text-stone-400">Cannot message yet</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <OutreachStatusBadge latest={latest} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status}>{STATUS_LABELS[c.status]}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        {filtered.map((c) => {
          const latest = latestByCandidate.get(c._id);

          return (
            <label
              key={c._id}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                selectedIds.has(c._id)
                  ? "border-coral-300 bg-coral-50/40"
                  : "border-stone-200 bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(c._id)}
                onChange={() => toggleOne(c._id)}
                className="mt-1"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/candidates/${c._id}`}
                    className="font-medium text-teal-800 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.name}
                  </Link>
                  <ScoreBadge score={c.score} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <PhoneBadge candidate={c} />
                  <OutreachStatusBadge latest={latest} />
                  <Badge variant={c.status}>{STATUS_LABELS[c.status]}</Badge>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
