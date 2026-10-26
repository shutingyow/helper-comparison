"use client";

import Link from "next/link";
import { ExternalLink, ArrowLeft, MessageCircle } from "lucide-react";
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
import {
  buildWhatsAppUrl,
  getCandidatePhone,
  getCandidatePhoneE164,
} from "@/lib/whatsapp";
import { getScoreWhySummary } from "@/lib/scoreHints";
import { PhoneBadge } from "@/components/PhoneBadge";
import { WhatsAppComposerSingle } from "@/components/WhatsAppComposer";
import { OutreachHistory } from "@/components/OutreachHistory";
import { useOutreachHistory } from "@/hooks/useOutreach";
import { InterviewScheduler } from "@/components/InterviewScheduler";
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
  const e164 = getCandidatePhoneE164(candidate);
  const waUrl = buildWhatsAppUrl(candidate, "interview_invite");
  const outreachHistory = useOutreachHistory(candidate._id);
  const workHistory = sortWorkHistoryByRecency(candidate.workHistory);
  const whyRanked = getScoreWhySummary(candidate);

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-stone-900">{candidate.name}</h1>
              <ScoreBadge candidate={candidate} size="lg" />
              <StatusBadge status={candidate.status} />
            </div>
            <p className="mt-1 text-sm text-stone-500">
              {[candidate.nationality, candidate.gender, candidate.age && `${candidate.age} yrs`]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="mt-2 text-sm text-stone-600">
              <span className="font-medium text-stone-700">Why ranked: </span>
              {whyRanked}
            </p>
            {!candidate.passesHardFilters && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-rose-700">
                  Hard filter failures
                </p>
                <FilterBadges filters={candidate.filterResults} />
              </div>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            {waUrl && e164 ? (
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="whatsapp" className="w-full sm:w-auto">
                  <MessageCircle className="h-4 w-4" />
                  Message on WhatsApp
                </Button>
              </a>
            ) : (
              <p className="text-sm text-stone-500">No valid WhatsApp phone</p>
            )}
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
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <ExternalLink className="h-4 w-4" />
                View on HelperPlace
              </Button>
            </a>
          </div>
        </div>
      </header>

      <section className="grid gap-x-8 gap-y-3 rounded-xl border border-stone-200/80 bg-white px-4 py-4 text-sm sm:grid-cols-2 sm:px-5">
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
      </section>

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

      {(candidate.skills.length > 0 ||
        candidate.languages.length > 0 ||
        (candidate.personalityTraits?.length ?? 0) > 0 ||
        (candidate.cookingSkills?.length ?? 0) > 0 ||
        candidate.education) && (
        <Card>
          <CardHeader>
            <CardTitle>Skills &amp; background</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {candidate.skills.length > 0 && (
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
            )}
            {(candidate.cookingSkills?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-medium text-stone-500">Cooking</p>
                <p className="mt-1 text-sm text-stone-700">
                  {candidate.cookingSkills!.join(", ")}
                </p>
              </div>
            )}
            {candidate.languages.length > 0 && (
              <div>
                <p className="text-xs font-medium text-stone-500">Languages</p>
                <p className="mt-1 text-sm text-stone-700">
                  {candidate.languages.join(", ")}
                </p>
              </div>
            )}
            {(candidate.personalityTraits?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-stone-500">Personality</p>
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
              </div>
            )}
            {candidate.education && (
              <div>
                <p className="text-xs font-medium text-stone-500">Education</p>
                <p className="mt-1 text-sm text-stone-700">{candidate.education}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      <InterviewScheduler candidate={candidate} />

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
