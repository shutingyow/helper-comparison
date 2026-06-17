"use client";

import { useState, useMemo } from "react";
import { useOutreachCandidates } from "@/hooks/useCandidates";
import { CandidateTable } from "@/components/CandidateTable";
import { WhatsAppComposer } from "@/components/WhatsAppComposer";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ConvexGuard } from "@/components/ConvexGuard";
import { Button } from "@/components/ui/button";
import type { Candidate } from "@/lib/types";

export default function OutreachPage() {
  const candidates = useOutreachCandidates();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"select" | "compose">("select");

  const selectedCandidates = useMemo(() => {
    if (!candidates) return [];
    return candidates.filter((c: Candidate) => selectedIds.has(c._id));
  }, [candidates, selectedIds]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Outreach</h1>
        <p className="mt-1 text-sm text-stone-500">
          Select candidates, open WhatsApp with a pre-filled message, then mark
          sent/replied here for tracking.
        </p>
      </header>

      <div className="mb-6 flex gap-2">
        <Button
          variant={step === "select" ? "default" : "outline"}
          size="sm"
          onClick={() => setStep("select")}
        >
          1. Select
        </Button>
        <Button
          variant={step === "compose" ? "default" : "outline"}
          size="sm"
          onClick={() => setStep("compose")}
          disabled={selectedIds.size === 0}
        >
          2. Compose ({selectedIds.size})
        </Button>
      </div>

      <ConvexGuard>
        {candidates === undefined ? (
          <LoadingState rows={6} />
        ) : step === "select" ? (
          candidates.length === 0 ? (
            <EmptyState
              title="No shortlisted candidates"
              description="Shortlist candidates from the inbox to start outreach."
            />
          ) : (
            <CandidateTable
              candidates={candidates}
              showFilters={false}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          )
        ) : selectedCandidates.length === 0 ? (
          <EmptyState
            title="No candidates selected"
            description="Go back and select at least one candidate."
            action={
              <Button size="sm" onClick={() => setStep("select")}>
                Select candidates
              </Button>
            }
          />
        ) : (
          <WhatsAppComposer candidates={selectedCandidates} />
        )}
      </ConvexGuard>
    </div>
  );
}
