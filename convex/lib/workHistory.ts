import { parseHelperPlaceDate } from "./ranking";

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

/** Most recent job first (by end date, then start date). */
export function sortWorkHistoryByRecency<T extends { period: string }>(
  entries: T[],
): T[] {
  return [...entries].sort((a, b) => {
    const endDiff = parsePeriodEnd(b.period) - parsePeriodEnd(a.period);
    if (endDiff !== 0) return endDiff;
    return parsePeriodStart(b.period) - parsePeriodStart(a.period);
  });
}
