"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KeyRound, Search, X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useInboxCandidates } from "@/hooks/useCandidates";
import { useLatestOutreachBatch } from "@/hooks/useOutreach";
import { CandidateTable } from "@/components/CandidateTable";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ConvexGuard } from "@/components/ConvexGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filterInboxCandidates,
  INBOX_FILTER_OPTIONS,
  INBOX_FILTER_LABELS,
  isInboxFilter,
  type InboxFilter,
} from "@/lib/inboxFilters";
import { cn } from "@/lib/utils";
import type { Doc } from "@/convex/_generated/dataModel";

type OutreachMessage = Doc<"outreachMessages">;

function matchesNameSearch(name: string, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;
  return name.toLowerCase().includes(trimmed.toLowerCase());
}

function InboxPageContent() {
  const searchParams = useSearchParams();
  const candidates = useInboxCandidates();
  const credentials = useQuery(api.scraperCredentials.getForCurrentUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all");

  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam && isInboxFilter(filterParam)) {
      setInboxFilter(filterParam);
    }
  }, [searchParams]);

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
  const hasCredentials = credentials?.hasPassword === true;
  const showConnectCta =
    candidates !== undefined &&
    credentials !== undefined &&
    candidates.length === 0 &&
    !hasCredentials;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Inbox</h1>
        <p className="mt-1 text-sm text-stone-500">
          Ranked by score — shortlist, message, or schedule interviews from the top.
        </p>
      </header>

      <div className="mb-4 space-y-3">
        <div className="max-w-md">
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

        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter candidates"
        >
          {INBOX_FILTER_OPTIONS.map((option) => {
            const selected = inboxFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setInboxFilter(option.value)}
                aria-pressed={selected}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  selected
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <ConvexGuard>
        {candidates === undefined || credentials === undefined ? (
          <LoadingState rows={8} />
        ) : showConnectCta ? (
          <EmptyState
            title="Connect HelperPlace to import your applicants"
            description="Save your HelperPlace employer credentials in settings. After you save, applicants are imported automatically every day at 8:00am Singapore time."
            icon={<KeyRound className="h-6 w-6" />}
            action={
              <Link href="/settings">
                <Button type="button">Connect HelperPlace</Button>
              </Link>
            }
          />
        ) : candidates.length === 0 ? (
          <EmptyState
            title="No applicants yet"
            description={
              hasCredentials
                ? "Your first import runs daily at 8:00am Singapore time. New applicants will appear here after the scrape completes."
                : "Run a scrape to import profiles from HelperPlace."
            }
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

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <LoadingState rows={6} />
        </div>
      }
    >
      <InboxPageContent />
    </Suspense>
  );
}
