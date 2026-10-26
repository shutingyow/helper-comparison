"use client";

import { useState } from "react";
import { Calendar, ExternalLink, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  useScheduleInterview,
  useUpdateInterview,
  useCancelInterview,
} from "@/hooks/useInterviews";
import type { Candidate, InterviewStatus, InterviewType } from "@/lib/types";
import {
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
} from "@/lib/types";
import {
  datetimeLocalToTimestamp,
  formatDateTimeSGT,
  timestampToDatetimeLocal,
} from "@/lib/utils";

const interviewTypes = Object.keys(INTERVIEW_TYPE_LABELS) as InterviewType[];

function buildGoogleCalendarUrl(
  candidate: Candidate,
  scheduledAt: number,
  type: InterviewType,
  locationOrLink?: string,
): string {
  const start = new Date(scheduledAt);
  const end = new Date(scheduledAt + 60 * 60 * 1000);
  const format = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Interview: ${candidate.name}`,
    dates: `${format(start)}/${format(end)}`,
    details: `Helper interview (${INTERVIEW_TYPE_LABELS[type]})`,
  });

  if (locationOrLink) params.set("location", locationOrLink);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function InterviewScheduler({ candidate }: { candidate: Candidate }) {
  const scheduleInterview = useScheduleInterview();
  const updateInterview = useUpdateInterview();
  const cancelInterview = useCancelInterview();

  const hasInterview =
    candidate.interviewScheduledAt != null &&
    candidate.interviewStatus != null &&
    candidate.interviewStatus !== "cancelled";

  const [editing, setEditing] = useState(!hasInterview);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scheduledAt, setScheduledAt] = useState(
    candidate.interviewScheduledAt
      ? timestampToDatetimeLocal(candidate.interviewScheduledAt)
      : "",
  );
  const [type, setType] = useState<InterviewType>(
    candidate.interviewType ?? "video",
  );
  const [locationOrLink, setLocationOrLink] = useState(
    candidate.interviewLocationOrLink ?? "",
  );
  const [notes, setNotes] = useState(candidate.interviewNotes ?? "");

  async function handleSave() {
    if (!scheduledAt) {
      setError("Please pick a date and time.");
      return;
    }

    const timestamp = datetimeLocalToTimestamp(scheduledAt);
    if (timestamp < Date.now() - 5 * 60 * 1000) {
      setError("Interview time must be in the future.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        candidateId: candidate._id,
        interviewScheduledAt: timestamp,
        interviewType: type,
        interviewLocationOrLink: locationOrLink || undefined,
        interviewNotes: notes || undefined,
      };

      if (hasInterview) {
        await updateInterview({
          ...payload,
          interviewStatus: "scheduled" as InterviewStatus,
        });
      } else {
        await scheduleInterview(payload);
      }
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save interview");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status: InterviewStatus) {
    setSaving(true);
    setError(null);
    try {
      await updateInterview({ candidateId: candidate._id, interviewStatus: status });
      if (status !== "scheduled") setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update interview");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel this interview?")) return;
    setSaving(true);
    setError(null);
    try {
      await cancelInterview({
        candidateId: candidate._id,
        notes: notes || undefined,
      });
      setEditing(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel interview");
    } finally {
      setSaving(false);
    }
  }

  if (!editing && hasInterview) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-jade-600" />
            Interview
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} disabled={saving}>
              Edit
            </Button>
            {candidate.interviewStatus === "scheduled" && (
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row
            label="When"
            value={formatDateTimeSGT(candidate.interviewScheduledAt!)}
          />
          <Row
            label="Type"
            value={INTERVIEW_TYPE_LABELS[candidate.interviewType ?? "video"]}
          />
          {candidate.interviewLocationOrLink && (
            <Row
              label={candidate.interviewType === "in_person" ? "Location" : "Link"}
              value={candidate.interviewLocationOrLink}
            />
          )}
          <Row
            label="Status"
            value={INTERVIEW_STATUS_LABELS[candidate.interviewStatus!]}
          />
          {candidate.interviewNotes && (
            <div>
              <p className="text-stone-500">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-stone-800">
                {candidate.interviewNotes}
              </p>
            </div>
          )}

          {candidate.interviewStatus === "scheduled" && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("completed")}
                disabled={saving}
              >
                Mark completed
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("no_show")}
                disabled={saving}
              >
                No show
              </Button>
              {candidate.interviewScheduledAt && candidate.interviewType && (
                <a
                  href={buildGoogleCalendarUrl(
                    candidate,
                    candidate.interviewScheduledAt,
                    candidate.interviewType,
                    candidate.interviewLocationOrLink,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline" type="button">
                    <ExternalLink className="h-4 w-4" />
                    Add to Google Calendar
                  </Button>
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-jade-600" />
          {hasInterview ? "Edit interview" : "Schedule interview"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="interview-datetime">Date & time</Label>
          <Input
            id="interview-datetime"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={saving}
          />
          <p className="text-xs text-stone-500">
            Times shown in your local timezone (SGT if you are in Singapore).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interview-type">Type</Label>
          <Select
            id="interview-type"
            value={type}
            onChange={(e) => setType(e.target.value as InterviewType)}
            disabled={saving}
          >
            {interviewTypes.map((t) => (
              <option key={t} value={t}>
                {INTERVIEW_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interview-location">
            {type === "in_person" ? "Location" : "Meeting link"}
          </Label>
          <Input
            id="interview-location"
            value={locationOrLink}
            onChange={(e) => setLocationOrLink(e.target.value)}
            placeholder={
              type === "in_person"
                ? "e.g. Home address or cafe"
                : "e.g. Zoom or Google Meet link"
            }
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interview-notes">Notes</Label>
          <Textarea
            id="interview-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Topics to cover, questions to ask..."
            className="min-h-[80px]"
            disabled={saving}
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : hasInterview ? "Update" : "Schedule"}
          </Button>
          {hasInterview && (
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              Cancel edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-stone-500">{label}</span>
      <span className="text-right font-medium text-stone-800">{value}</span>
    </div>
  );
}
