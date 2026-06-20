"use client";

import Link from "next/link";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { useCandidate, useUpdateStatus } from "@/hooks/useCandidates";
import { StatusSelect } from "@/components/StatusSelect";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { FilterBadges } from "@/components/FilterBadges";
import { NotesEditor } from "@/components/NotesEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { ConvexGuard } from "@/components/ConvexGuard";
import type { Candidate, CandidateStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { sortWorkHistoryByRecency } from "@/lib/workHistory";
import { getCandidatePhone } from "@/lib/whatsapp";
import { PhoneBadge } from "@/components/PhoneBadge";
import { WhatsAppComposerSingle } from "@/components/WhatsAppComposer";
import { OutreachHistory } from "@/components/OutreachHistory";
import { useOutreachHistory } from "@/hooks/useOutreach";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

export function CandidateDetailClient({ id }: { id: string }) {
  const candidate = useCandidate(id as Id<"candidates">);
  const updateStatus = useUpdateStatus();
  const [statusSaving, setStatusSaving] = useState(false);

  async function handleStatusChange(status: CandidateStatus) {
    if (!candidate) return;
    setStatusSaving(true);
    try {
      await updateStatus({ candidateId: candidate._id, status });
    } finally {
      setStatusSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/inbox"
        className="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-coral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to inbox
      </Link>

      <ConvexGuard>
        {candidate === undefined ? (
          <LoadingState rows={5} />
        ) : candidate === null ? (
          <EmptyState
            title="Candidate not found"
            description="This profile may have been removed."
          />
        ) : (
          <CandidateProfile
            candidate={candidate}
            onStatusChange={handleStatusChange}
            statusSaving={statusSaving}
          />
        )}
      </ConvexGuard>
    </div>
  );
}

function CandidateProfile({
  candidate,
  onStatusChange,
  statusSaving,
}: {
  candidate: Candidate;
  onStatusChange: (status: CandidateStatus) => void;
  statusSaving: boolean;
}) {
  const phone = getCandidatePhone(candidate);
  const outreachHistory = useOutreachHistory(candidate._id);
  const workHistory = sortWorkHistoryByRecency(candidate.workHistory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-stone-900">{candidate.name}</h1>
            <ScoreBadge candidate={candidate} size="lg" />
            <StatusBadge status={candidate.status} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {[candidate.nationality, candidate.gender, candidate.age && `${candidate.age} yrs`]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {!candidate.passesHardFilters && (
            <FilterBadges filters={candidate.filterResults} className="mt-3" />
          )}
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <StatusSelect
            value={candidate.status}
            onChange={onStatusChange}
            disabled={statusSaving}
            className="w-full sm:w-44"
          />
          <a
            href={candidate.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4" />
              View on HelperPlace
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Available from" value={candidate.availableFrom ?? "—"} />
            <Row label="Contract" value={candidate.contractStatus ?? "—"} />
            <Row label="Location" value={candidate.presentLocation ?? "—"} />
            <Row
              label="Experience"
              value={
                candidate.yearsExperience != null
                  ? `${candidate.yearsExperience} years`
                  : "—"
              }
            />
            {candidate.salaryExpectation && (
              <Row label="Salary ask" value={candidate.salaryExpectation} />
            )}
            {candidate.dayOff && <Row label="Day off" value={candidate.dayOff} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-stone-500">Phone</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-stone-800">{phone ?? "—"}</span>
                <PhoneBadge candidate={candidate} />
              </div>
            </div>
            <Row label="Ref letters" value={String(candidate.referenceLetterCount)} />
            <Row label="First seen" value={formatDate(candidate.firstSeenAt)} />
            <Row label="Last scraped" value={formatDate(candidate.scrapedAt)} />
            {candidate.messagedAt && (
              <Row label="Messaged" value={formatDate(candidate.messagedAt)} />
            )}
          </CardContent>
        </Card>
      </div>

      {(phone || candidate.whatsapp || candidate.phone) && (
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp outreach</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <WhatsAppComposerSingle candidate={candidate} />
            <div>
              <p className="mb-3 text-sm font-medium text-stone-700">History</p>
              <OutreachHistory messages={outreachHistory} />
            </div>
          </CardContent>
        </Card>
      )}

      {candidate.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700"
                >
                  {skill}
                </span>
              ))}
            </div>
            {(candidate.cookingSkills?.length ?? 0) > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-stone-500">Cooking</p>
                <p className="mt-1 text-sm text-stone-700">
                  {candidate.cookingSkills!.join(", ")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(candidate.personalityTraits?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {candidate.personalityTraits!.map((trait) => (
                <span
                  key={trait}
                  className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-600"
                >
                  {trait}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {candidate.languages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-stone-700">{candidate.languages.join(", ")}</p>
          </CardContent>
        </Card>
      )}

      {candidate.education && (
        <Card>
          <CardHeader>
            <CardTitle>Education</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-stone-700">{candidate.education}</p>
          </CardContent>
        </Card>
      )}

      {candidate.aboutMe && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-stone-700">
              {candidate.aboutMe}
            </p>
          </CardContent>
        </Card>
      )}

      {workHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Work history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workHistory.map((job, i) => (
              <div
                key={i}
                className="border-b border-stone-100 pb-4 last:border-0 last:pb-0"
              >
                <p className="font-medium text-stone-900">
                  {job.title}
                  {job.location ? ` · ${job.location}` : ""}
                  {job.employer ? ` — ${job.employer}` : ""}
                </p>
                <p className="text-xs text-stone-500">{job.period}</p>
                <p className="mt-1 text-sm text-stone-600">{job.duties}</p>
                <span
                  className={`mt-1 inline-block text-xs ${
                    job.hasReferenceLetter ? "text-emerald-700" : "text-stone-400"
                  }`}
                >
                  {job.hasReferenceLetter
                    ? "Has reference letter"
                    : "No reference letter"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Private notes</CardTitle>
        </CardHeader>
        <CardContent>
          <NotesEditor
            candidateId={candidate._id}
            initialNotes={candidate.notes ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-800">{value}</span>
    </div>
  );
}
