"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useCandidateList } from "@/hooks/useCandidates";
import { CandidateTable } from "@/components/CandidateTable";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ConvexGuard } from "@/components/ConvexGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function matchesNameSearch(name: string, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;
  return name.toLowerCase().includes(trimmed.toLowerCase());
}

export default function InboxPage() {
  const candidates = useCandidateList();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];
    return candidates.filter((c) => matchesNameSearch(c.name, searchQuery));
  }, [candidates, searchQuery]);

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Inbox</h1>
        <p className="mt-1 text-sm text-stone-500">
          All candidates — search by name, sort by score, date, or start date.
        </p>
      </header>

      <div className="mb-4">
        <label htmlFor="inbox-search" className="sr-only">
          Search candidates by name
        </label>
        <div className="relative max-w-md">
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
            description={`No candidates named "${searchQuery.trim()}". Try a different spelling.`}
            action={
              <Button type="button" variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <CandidateTable candidates={filteredCandidates} />
        )}
      </ConvexGuard>
    </div>
  );
}
