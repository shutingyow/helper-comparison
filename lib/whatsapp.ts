import type { Candidate, MessageTemplate } from "./types";
import {
  buildWhatsAppLink,
  formatPhoneDisplay,
  normalizeSingaporePhone,
} from "./phone";

export interface TemplateContext {
  candidateName: string;
  availableFrom?: string;
  employerName?: string;
}

export const MESSAGE_TEMPLATES: Record<
  MessageTemplate,
  { label: string; build: (ctx: TemplateContext) => string }
> = {
  interview_invite: {
    label: "Interview Invite",
    build: ({ candidateName, employerName }) =>
      `Hi ${candidateName}, we came across your profile on HelperPlace${
        employerName ? ` (${employerName})` : ""
      } and would love to schedule a short interview. Are you available this week for a chat? Thank you!`,
  },
  reference_request: {
    label: "Reference Request",
    build: ({ candidateName }) =>
      `Hi ${candidateName}, thank you for your interest. Could you please share contact details for your previous employer(s) for a reference check? We appreciate your help!`,
  },
  follow_up: {
    label: "Follow-up",
    build: ({ candidateName }) =>
      `Hi ${candidateName}, just following up on my earlier message. Please let me know if you're still available and interested. Looking forward to hearing from you!`,
  },
};

export const TEMPLATE_OPTIONS: MessageTemplate[] = [
  "interview_invite",
  "reference_request",
  "follow_up",
];

export function buildTemplateContext(
  candidate: Candidate,
  employerName?: string,
): TemplateContext {
  return {
    candidateName: candidate.name,
    availableFrom: candidate.availableFrom,
    employerName,
  };
}

export function renderMessage(
  template: MessageTemplate,
  candidate: Candidate,
  employerName?: string,
): string {
  return MESSAGE_TEMPLATES[template].build(
    buildTemplateContext(candidate, employerName),
  );
}

export function getCandidatePhone(candidate: Candidate): string | null {
  const rawPhone = candidate.whatsapp ?? candidate.phone;
  return formatPhoneDisplay(rawPhone);
}

export function getCandidatePhoneE164(candidate: Candidate): string | null {
  const rawPhone = candidate.whatsapp ?? candidate.phone;
  return normalizeSingaporePhone(rawPhone) ?? null;
}

export function buildWhatsAppUrl(
  candidate: Candidate,
  template: MessageTemplate,
  employerName?: string,
): string | null {
  const rawPhone = candidate.whatsapp ?? candidate.phone;
  const message = renderMessage(template, candidate, employerName);
  return buildWhatsAppLink(rawPhone, message);
}
