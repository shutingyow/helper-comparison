import type { WorkHistoryEntry } from "../types.js";

function parseHelperPlaceDate(dateStr: string): number | undefined {
  const cleaned = dateStr.trim();
  const match = cleaned.match(
    /(?:(\d{1,2})\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
  );
  if (!match) return undefined;
  const months: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };
  const day = match[1] ? parseInt(match[1], 10) : 1;
  const month = months[match[2]!.toLowerCase().slice(0, 3)];
  const year = parseInt(match[3]!, 10);
  if (month === undefined) return undefined;
  return new Date(year, month, day).getTime();
}

function parsePeriodEnd(period: string): number {
  const endPart = period.split(/\s*-\s*/).pop()?.trim() ?? "";
  if (/present|now/i.test(endPart)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return parseHelperPlaceDate(endPart) ?? 0;
}

function parsePeriodStart(period: string): number {
  const startPart = period.split(/\s*-\s*/)[0]?.trim() ?? "";
  return parseHelperPlaceDate(startPart) ?? 0;
}

export function sortWorkHistoryByRecency(
  entries: WorkHistoryEntry[],
): WorkHistoryEntry[] {
  return [...entries].sort((a, b) => {
    const endDiff = parsePeriodEnd(b.period) - parsePeriodEnd(a.period);
    if (endDiff !== 0) return endDiff;
    return parsePeriodStart(b.period) - parsePeriodStart(a.period);
  });
}
