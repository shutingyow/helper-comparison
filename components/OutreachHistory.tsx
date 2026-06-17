import { formatDate } from "@/lib/utils";
import { MESSAGE_TEMPLATES } from "@/lib/whatsapp";
import type { MessageTemplate } from "@/lib/types";
import type { Doc } from "@/convex/_generated/dataModel";

type OutreachMessage = Doc<"outreachMessages">;

const STATUS_LABELS: Record<OutreachMessage["status"], string> = {
  opened: "Opened",
  sent: "Sent",
  replied: "Replied",
};

function getTemplateLabel(templateKey: string): string {
  if (templateKey in MESSAGE_TEMPLATES) {
    return MESSAGE_TEMPLATES[templateKey as MessageTemplate].label;
  }
  return templateKey;
}

export function OutreachHistory({
  messages,
}: {
  messages: OutreachMessage[] | undefined;
}) {
  if (messages === undefined) {
    return <p className="text-sm text-stone-500">Loading outreach history…</p>;
  }

  if (messages.length === 0) {
    return (
      <p className="text-sm text-stone-500">No WhatsApp messages tracked yet.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {messages.map((message) => (
        <li
          key={message._id}
          className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-stone-900">
              {getTemplateLabel(message.templateKey)}
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
              {STATUS_LABELS[message.status]}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-stone-700">
            {message.renderedText}
          </p>
          <p className="mt-2 text-xs text-stone-500">
            To {message.toE164}
            {" · "}
            Opened {formatDate(message.openedAt)}
            {message.sentAt ? ` · Sent ${formatDate(message.sentAt)}` : ""}
            {message.repliedAt ? ` · Replied ${formatDate(message.repliedAt)}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
