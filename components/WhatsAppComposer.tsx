"use client";

import { useState } from "react";
import { Check, ExternalLink, MessageCircle, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneBadge } from "@/components/PhoneBadge";
import type { Candidate, MessageTemplate } from "@/lib/types";
import {
  MESSAGE_TEMPLATES,
  TEMPLATE_OPTIONS,
  buildWhatsAppUrl,
  getCandidatePhone,
  getCandidatePhoneE164,
  renderMessage,
} from "@/lib/whatsapp";
import {
  useLatestOutreach,
  useMarkOutreachReplied,
  useMarkOutreachSent,
  useRecordOutreachOpened,
} from "@/hooks/useOutreach";
import { formatDate } from "@/lib/utils";

interface WhatsAppComposerProps {
  candidates: Candidate[];
  employerName?: string;
  onStatusChange?: () => void;
}

function CandidateOutreachRow({
  candidate,
  template,
  employerName,
  onStatusChange,
}: {
  candidate: Candidate;
  template: MessageTemplate;
  employerName?: string;
  onStatusChange?: () => void;
}) {
  const latest = useLatestOutreach(candidate._id);
  const recordOpened = useRecordOutreachOpened();
  const markSent = useMarkOutreachSent();
  const markReplied = useMarkOutreachReplied();
  const [pending, setPending] = useState<"open" | "sent" | "replied" | null>(
    null,
  );

  const phone = getCandidatePhone(candidate);
  const e164 = getCandidatePhoneE164(candidate);
  const url = buildWhatsAppUrl(candidate, template, employerName);
  const message = renderMessage(template, candidate, employerName);

  async function handleOpenWhatsApp() {
    if (!url || !e164) return;
    window.open(url, "_blank", "noopener,noreferrer");
    setPending("open");
    try {
      await recordOpened({
        candidateId: candidate._id,
        templateKey: template,
        renderedText: message,
        toE164: e164,
      });
      onStatusChange?.();
    } finally {
      setPending(null);
    }
  }

  async function handleMarkSent() {
    if (!latest?._id) return;
    setPending("sent");
    try {
      await markSent({ outreachId: latest._id });
      onStatusChange?.();
    } finally {
      setPending(null);
    }
  }

  async function handleMarkReplied() {
    if (!latest?._id) return;
    setPending("replied");
    try {
      await markReplied({ outreachId: latest._id });
      onStatusChange?.();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-stone-900">{candidate.name}</p>
            <PhoneBadge candidate={candidate} />
          </div>
          <p className="text-sm text-stone-500">{phone ?? "No valid phone number"}</p>
          {latest && (
            <p className="text-xs text-stone-500">
              Last outreach: {latest.status}
              {" · "}
              {formatDate(latest.openedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="whatsapp"
            size="sm"
            onClick={handleOpenWhatsApp}
            disabled={!url || pending !== null}
          >
            <ExternalLink className="h-4 w-4" />
            {pending === "open" ? "Opening…" : "Open WhatsApp"}
          </Button>
          {latest?.status === "opened" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkSent}
              disabled={pending !== null}
            >
              <Check className="h-4 w-4" />
              {pending === "sent" ? "Saving…" : "Mark as sent"}
            </Button>
          )}
          {latest?.status === "sent" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkReplied}
              disabled={pending !== null}
            >
              <Reply className="h-4 w-4" />
              {pending === "replied" ? "Saving…" : "Mark as replied"}
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-lg bg-stone-50 p-3 text-sm text-stone-700">
        {message}
      </div>
    </div>
  );
}

export function WhatsAppComposer({
  candidates,
  employerName,
  onStatusChange,
}: WhatsAppComposerProps) {
  const [template, setTemplate] = useState<MessageTemplate>("interview_invite");

  const withPhone = candidates.filter((c) => getCandidatePhoneE164(c));
  const withoutPhone = candidates.filter((c) => !getCandidatePhoneE164(c));

  const previewMessage = withPhone[0]
    ? renderMessage(template, withPhone[0], employerName)
    : "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            Message template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={template}
            onChange={(e) => setTemplate(e.target.value as MessageTemplate)}
          >
            {TEMPLATE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {MESSAGE_TEMPLATES[t].label}
              </option>
            ))}
          </Select>
          {previewMessage && (
            <div className="rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
              <p className="mb-1 text-xs font-medium uppercase text-stone-400">
                Preview
              </p>
              {previewMessage}
            </div>
          )}
          <p className="text-xs text-stone-500">
            Open WhatsApp to pre-fill the message, then tap Send in WhatsApp.
            Come back here to mark it as sent once you&apos;ve sent it.
          </p>
        </CardContent>
      </Card>

      {withoutPhone.length > 0 && (
        <p className="text-sm text-amber-700">
          {withoutPhone.length} selected candidate
          {withoutPhone.length !== 1 ? "s" : ""} missing or invalid phone numbers.
        </p>
      )}

      <div className="space-y-3">
        {withPhone.map((candidate) => (
          <CandidateOutreachRow
            key={candidate._id}
            candidate={candidate}
            template={template}
            employerName={employerName}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>

      {withPhone.length === 0 && (
        <p className="text-center text-sm text-stone-500">
          Select candidates with valid Singapore phone numbers to send WhatsApp
          messages.
        </p>
      )}
    </div>
  );
}

export function WhatsAppComposerSingle({
  candidate,
  employerName,
}: {
  candidate: Candidate;
  employerName?: string;
}) {
  return (
    <WhatsAppComposer
      candidates={[candidate]}
      employerName={employerName}
    />
  );
}
