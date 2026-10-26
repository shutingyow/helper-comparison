import Link from "next/link";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Candidate, TodaySummary } from "@/lib/types";
import { INTERVIEW_TYPE_LABELS } from "@/lib/types";
import { formatDate, formatInterviewWhen, formatRelativeDate } from "@/lib/utils";

type TodaySummaryProps =
  | { summary: TodaySummary; upcomingInterviews?: Candidate[] }
  | {
      lastScrapeAt?: number;
      newCount: number;
      updatedCount: number;
      topCandidates: Candidate[];
      newCandidates: Candidate[];
      upcomingInterviews?: Candidate[];
    };

export function TodaySummary(props: TodaySummaryProps) {
  const data =
    "summary" in props
      ? {
          lastScrapeAt: props.summary.lastScrapeAt,
          newCount: props.summary.newCount,
          updatedCount: 0,
          newCandidates: props.summary.newSinceLastScrape,
          topCandidates: props.summary.topByScore,
          upcomingInterviews: props.upcomingInterviews ?? [],
        }
      : props;

  const {
    lastScrapeAt,
    newCount,
    updatedCount,
    topCandidates,
    newCandidates,
    upcomingInterviews = [],
  } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">
              Last scrape
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-stone-900">
              {lastScrapeAt ? formatRelativeDate(lastScrapeAt) : "Never"}
            </p>
            {lastScrapeAt && (
              <p className="text-xs text-stone-500">{formatDate(lastScrapeAt)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">
              New today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-jade-800">{newCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">
              Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-stone-900">{updatedCount}</p>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">
          Upcoming interviews ({upcomingInterviews.length})
        </h2>
        {upcomingInterviews.length === 0 ? (
          <p className="text-sm text-stone-600">
            No interviews scheduled in the next 7 days.
          </p>
        ) : (
          <ul className="space-y-2">
            {upcomingInterviews.map((c) => (
              <li
                key={c._id}
                className="flex items-center justify-between rounded-lg border border-jade-100 bg-jade-50/50 px-4 py-3"
              >
                <div>
                  <Link
                    href={`/candidates/${c._id}`}
                    className="font-medium text-jade-800 hover:underline"
                  >
                    {c.name}
                  </Link>
                  <p className="text-xs text-stone-600">
                    {c.interviewScheduledAt != null
                      ? formatInterviewWhen(c.interviewScheduledAt)
                      : "—"}
                    {c.interviewType
                      ? ` · ${INTERVIEW_TYPE_LABELS[c.interviewType]}`
                      : ""}
                  </p>
                </div>
                <ScoreBadge score={c.score} candidate={c} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">
          New applicants ({newCandidates.length})
        </h2>
        {newCandidates.length === 0 ? (
          <p className="text-sm text-stone-600">No new applicants since last scrape.</p>
        ) : (
          <ul className="space-y-2">
            {newCandidates.slice(0, 10).map((c) => (
              <li
                key={c._id}
                className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-900">{c.name}</p>
                  <p className="text-xs text-stone-500">{c.availableFrom ?? "—"}</p>
                </div>
                <ScoreBadge score={c.score} candidate={c} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">
          Top ranked (passing filters)
        </h2>
        {topCandidates.length === 0 ? (
          <p className="text-sm text-stone-600">No qualifying candidates yet.</p>
        ) : (
          <ul className="space-y-2">
            {topCandidates.slice(0, 10).map((c) => (
              <li
                key={c._id}
                className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-900">{c.name}</p>
                  <p className="text-xs text-stone-500">
                    {c.referenceLetterCount} ref · {c.yearsExperience ?? "?"} yrs
                  </p>
                </div>
                <ScoreBadge score={c.score} candidate={c} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
