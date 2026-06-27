"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useInboxCandidates } from "@/hooks/useCandidates";
import { useLatestOutreachBatch } from "@/hooks/useOutreach";
import { CandidateTable } from "@/components/CandidateTable";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ConvexGuard } from "@/components/ConvexGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  filterInboxCandidates,
  INBOX_FILTER_OPTIONS,
  INBOX_FILTER_LABELS,
  type InboxFilter,
} from "@/lib/inboxFilters";
import type { Doc } from "@/convex/_generated/dataModel";

type OutreachMessage = Doc<"outreachMessages">;

function matchesNameSearch(name: string, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;
  return name.toLowerCase().includes(trimmed.toLowerCase());
}

export default function InboxPage() {
  const candidates = useInboxCandidates();
  const [searchQuery, setSearchQuery] = useState("");
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all");

  const candidateIds = useMemo(() => candidates?.map((c) => c._id) ?? [], [candidates]);
  const latestBatch = useLatestOutreachBatch(candidateIds);

  const latestByCandidate = useMemo(() => {
    const map = new Map<string, OutreachMessage | null>();
    for (const row of latestBatch ?? []) {
      map.set(row.candidateId, row.latest);
    }
    return map;
  }, [latestBatch]);

  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];
    const byFilter = filterInboxCandidates(candidates, inboxFilter, latestByCandidate);
    return byFilter.filter((c) => matchesNameSearch(c.name, searchQuery));
  }, [candidates, inboxFilter, latestByCandidate, searchQuery]);

  const hasSearch = searchQuery.trim().length > 0;
  const hasFilter = inboxFilter !== "all";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Inbox</h1>
        <p className="mt-1 text-sm text-stone-500">
          All active candidates — filter by pipeline stage, search by name, or sort
          by score, date, or start date.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1 max-w-md">
          <label htmlFor="inbox-search" className="mb-1 block text-xs text-stone-500">
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden
            />
            <Input
              id="inbox-search"
              type="search"
              placeholder="Search by name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {hasSearch && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-stone-500"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <label className="flex flex-col gap-1 text-xs text-stone-500">
          Filter by
          <Select
            value={inboxFilter}
            onChange={(e) => setInboxFilter(e.target.value as InboxFilter)}
            className="min-w-[180px]"
          >
            {INBOX_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <ConvexGuard>
        {candidates === undefined ? (
          <LoadingState rows={8} />
        ) : candidates.length === 0 ? (
          <EmptyState
            title="No candidates yet"
            description="Run a scrape to import profiles from HelperPlace."
          />
        ) : filteredCandidates.length === 0 ? (
          <EmptyState
            title="No matches"
            description={
              hasSearch && hasFilter
                ? `No candidates match "${INBOX_FILTER_LABELS[inboxFilter]}" and the name "${searchQuery.trim()}".`
                : hasSearch
                  ? `No candidates named "${searchQuery.trim()}". Try a different spelling.`
                  : `No candidates match "${INBOX_FILTER_LABELS[inboxFilter]}".`
            }
            action={
              hasSearch || hasFilter ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {hasSearch && (
                    <Button type="button" variant="outline" onClick={() => setSearchQuery("")}>
                      Clear search
                    </Button>
                  )}
                  {hasFilter && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setInboxFilter("all")}
                    >
                      Show all
                    </Button>
                  )}
                </div>
              ) : undefined
            }
          />
        ) : (
          <CandidateTable candidates={filteredCandidates} />
        )}
      </ConvexGuard>
    </div>
  );
}
