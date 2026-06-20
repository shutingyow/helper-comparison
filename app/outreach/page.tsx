"use client";

import { useMemo, useState } from "react";
import { ChevronRight, MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import {
  OutreachCandidateList,
  type OutreachFilter,
  type PhoneFilter,
  type PipelineFilter,
} from "@/components/OutreachCandidateList";
import { WhatsAppComposer } from "@/components/WhatsAppComposer";
import { ConvexGuard } from "@/components/ConvexGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useOutreachCandidates } from "@/hooks/useCandidates";
import {
  MESSAGE_TEMPLATES,
  TEMPLATE_OPTIONS,
  getCandidatePhoneE164,
  renderMessage,
} from "@/lib/whatsapp";
import type { Candidate, MessageTemplate } from "@/lib/types";

const WORKFLOW_STEPS = [
  { n: 1, title: "Choose template", detail: "Pick a message and preview it" },
  { n: 2, title: "Select candidates", detail: "Filter and check who to message" },
  { n: 3, title: "Send & track", detail: "Open WhatsApp, then mark sent/replied" },
] as const;

function WorkflowGuide() {
  return (
    <Card className="border-stone-200/80 bg-stone-50/50">
      <CardContent className="p-4 sm:p-5">
        <ol className="grid gap-4 sm:grid-cols-3">
          {WORKFLOW_STEPS.map((step, i) => (
            <li key={step.n} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral-600 text-xs font-semibold text-white">
                {step.n}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-900">{step.title}</p>
                <p className="text-xs text-stone-500">{step.detail}</p>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <ChevronRight className="mt-2 hidden h-4 w-4 text-stone-300 sm:block" />
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default function OutreachPage() {
  const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>("shortlisted");
  const [phoneFilter, setPhoneFilter] = useState<PhoneFilter>("ready");
  const [outreachFilter, setOutreachFilter] = useState<OutreachFilter>("all");
  const [template, setTemplate] = useState<MessageTemplate>("interview_invite");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const queryArgs = useMemo(() => {
    if (pipelineFilter === "all") return { includeAll: true as const };
    return { status: pipelineFilter };
  }, [pipelineFilter]);

  const candidates = useOutreachCandidates(queryArgs);

  const selectedCandidates = useMemo(() => {
    if (!candidates) return [];
    return candidates.filter((c: Candidate) => selectedIds.has(c._id));
  }, [candidates, selectedIds]);

  const previewCandidate =
    selectedCandidates.find((c) => getCandidatePhoneE164(c)) ??
    candidates?.find((c: Candidate) => getCandidatePhoneE164(c));

  const previewMessage = previewCandidate
    ? renderMessage(template, previewCandidate)
    : "Select a candidate with a valid phone to preview the personalized message.";

  const readySelectedCount = selectedCandidates.filter((c) =>
    getCandidatePhoneE164(c),
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Outreach</h1>
        <p className="mt-1 text-sm text-stone-500">
          Send WhatsApp messages to shortlisted helpers and track who you&apos;ve
          contacted.
        </p>
      </header>

      <div className="mb-6">
        <WorkflowGuide />
      </div>

      <ConvexGuard>
        {candidates === undefined ? (
          <LoadingState rows={6} />
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-[#25D366]" />
                  Step 1 — Message template
                </CardTitle>
                <CardDescription>
                  Choose a template. Each candidate sees their name in the preview.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as MessageTemplate)}
                >
                  {TEMPLATE_OPTIONS.map((key) => (
                    <option key={key} value={key}>
                      {MESSAGE_TEMPLATES[key].label}
                    </option>
                  ))}
                </Select>
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                    Live preview
                    {previewCandidate ? ` · ${previewCandidate.name}` : ""}
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-stone-700">
                    {previewMessage}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 2 — Select candidates</CardTitle>
                <CardDescription>
                  Defaults to shortlisted helpers with valid phones. Adjust filters
                  to include others or follow up on earlier messages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <label className="flex flex-col gap-1 text-xs text-stone-500">
                    Pipeline
                    <Select
                      value={pipelineFilter}
                      onChange={(e) => {
                        setPipelineFilter(e.target.value as PipelineFilter);
                        setSelectedIds(new Set());
                      }}
                      className="min-w-[140px]"
                    >
                      <option value="shortlisted">Shortlisted</option>
                      <option value="new">New</option>
                      <option value="messaged">Messaged</option>
                      <option value="all">All active</option>
                    </Select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-stone-500">
                    Phone
                    <Select
                      value={phoneFilter}
                      onChange={(e) => setPhoneFilter(e.target.value as PhoneFilter)}
                      className="min-w-[140px]"
                    >
                      <option value="ready">WhatsApp ready</option>
                      <option value="all">All (incl. missing)</option>
                    </Select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-stone-500">
                    Outreach status
                    <Select
                      value={outreachFilter}
                      onChange={(e) =>
                        setOutreachFilter(e.target.value as OutreachFilter)
                      }
                      className="min-w-[140px]"
                    >
                      <option value="all">Any status</option>
                      <option value="not_contacted">Not contacted</option>
                      <option value="opened">Opened</option>
                      <option value="sent">Sent</option>
                      <option value="replied">Replied</option>
                    </Select>
                  </label>
                </div>

                {candidates.length === 0 ? (
                  <EmptyState
                    title="No candidates in this pipeline"
                    description="Shortlist candidates from the inbox to start outreach."
                  />
                ) : (
                  <OutreachCandidateList
                    candidates={candidates}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    phoneFilter={phoneFilter}
                    outreachFilter={outreachFilter}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 3 — Send &amp; track</CardTitle>
                <CardDescription>
                  Open WhatsApp with a pre-filled message, send it there, then mark
                  progress here so you know who still needs a follow-up.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedIds.size === 0 ? (
                  <EmptyState
                    title="No candidates selected"
                    description="Select one or more candidates above to start messaging."
                  />
                ) : readySelectedCount === 0 ? (
                  <EmptyState
                    title="No valid phone numbers"
                    description="The selected candidates are missing or have invalid Singapore phone numbers. Try selecting others or fix phone data on their profile."
                  />
                ) : (
                  <>
                    {readySelectedCount < selectedIds.size && (
                      <p className="mb-4 text-sm text-amber-700">
                        {selectedIds.size - readySelectedCount} selected candidate
                        {selectedIds.size - readySelectedCount !== 1 ? "s" : ""}{" "}
                        skipped — no valid phone number.
                      </p>
                    )}
                    <WhatsAppComposer
                      candidates={selectedCandidates}
                      template={template}
                      showTemplatePicker={false}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </ConvexGuard>
    </div>
  );
}
