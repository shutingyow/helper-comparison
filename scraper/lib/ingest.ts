import type { IngestPayload, IngestResponse } from "../types.js";

const DEFAULT_INGEST_URL = "http://localhost:3000/api/ingest";

/** Always derive canonical ingest URLs from origin — avoids double /api paths. */
export function getIngestEndpoints(): {
  ingestUrl: string;
  knownIdsUrl: string;
  missingPhoneIdsUrl: string;
  scraperConfigUrl: string;
  scraperTargetsUrl: string;
} {
  const raw = (process.env.INGEST_URL ?? DEFAULT_INGEST_URL).trim();
  let origin: string;
  try {
    origin = new URL(raw).origin;
  } catch {
    origin = "http://localhost:3000";
  }
  return {
    ingestUrl: `${origin}/api/ingest`,
    knownIdsUrl: `${origin}/api/ingest/known-ids`,
    missingPhoneIdsUrl: `${origin}/api/ingest/missing-phone-ids`,
    scraperConfigUrl: `${origin}/api/scraper/config`,
    scraperTargetsUrl: `${origin}/api/scraper/targets`,
  };
}

function getScrapeUserId(): string | undefined {
  return process.env.SCRAPE_USER_ID?.trim() || undefined;
}

function withUserId(url: string): string {
  const userId = getScrapeUserId();
  if (!userId) return url;
  const parsed = new URL(url);
  parsed.searchParams.set("userId", userId);
  return parsed.toString();
}

async function readJsonResponse<T>(response: Response, context: string): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  if (!contentType.includes("application/json")) {
    const preview = body.slice(0, 200).replace(/\s+/g, " ");
    throw new Error(
      `${context}: expected JSON but got ${response.status} ${contentType || "unknown type"}. ` +
        `Body starts with: ${preview}`,
    );
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    const preview = body.slice(0, 200).replace(/\s+/g, " ");
    throw new Error(
      `${context}: invalid JSON in ${response.status} response. Body starts with: ${preview}`,
    );
  }
}

export async function fetchKnownHelperPlaceIds(): Promise<Set<string>> {
  const secret = process.env.INGEST_SECRET;
  if (!secret) {
    console.warn("INGEST_SECRET not set — skipping known-ID lookup, will parse all profiles.");
    return new Set();
  }

  const { knownIdsUrl } = getIngestEndpoints();
  console.log(`Fetching known candidate IDs from ${knownIdsUrl} ...`);

  try {
    const response = await fetch(withUserId(knownIdsUrl), {
      headers: { "x-ingest-secret": secret },
    });

    if (!response.ok) {
      const preview = (await response.text().catch(() => "")).slice(0, 200);
      console.warn(
        `Could not fetch known candidate IDs (HTTP ${response.status}) — parsing all profiles. ` +
          (preview ? `Response: ${preview}` : ""),
      );
      return new Set();
    }

    const body = await readJsonResponse<{ helperPlaceIds?: string[] }>(
      response,
      "known-ids",
    );
    const ids = new Set(body.helperPlaceIds ?? []);
    console.log(`Found ${ids.size} candidate(s) already in dashboard.`);
    return ids;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`${message} — parsing all profiles.`);
    return new Set();
  }
}

export interface MissingPhoneCandidate {
  helperPlaceId: string;
  profileUrl: string;
}

export async function fetchMissingPhoneCandidates(): Promise<MissingPhoneCandidate[]> {
  const secret = process.env.INGEST_SECRET;
  if (!secret) {
    return [];
  }

  const { missingPhoneIdsUrl } = getIngestEndpoints();
  console.log(`Fetching candidates missing phone from ${missingPhoneIdsUrl} ...`);

  try {
    const response = await fetch(withUserId(missingPhoneIdsUrl), {
      headers: { "x-ingest-secret": secret },
    });

    if (!response.ok) {
      console.warn(
        `Could not fetch missing-phone IDs (HTTP ${response.status}) — skipping phone backfill.`,
      );
      return [];
    }

    const body = await readJsonResponse<{
      candidates?: MissingPhoneCandidate[];
      helperPlaceIds?: string[];
    }>(response, "missing-phone-ids");

    if (body.candidates?.length) {
      console.log(`Found ${body.candidates.length} candidate(s) missing phone numbers.`);
      return body.candidates;
    }

    const legacyIds = body.helperPlaceIds ?? [];
    console.log(`Found ${legacyIds.length} candidate(s) missing phone numbers.`);
    return legacyIds.map((helperPlaceId) => ({
      helperPlaceId,
      profileUrl: `https://www.helperplace.com/resume/singapore/domestic-helper/${helperPlaceId}`,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`${message} — skipping phone backfill.`);
    return [];
  }
}

export async function ingestCandidates(payload: IngestPayload): Promise<IngestResponse> {
  const { ingestUrl } = getIngestEndpoints();
  const secret = process.env.INGEST_SECRET;

  if (!secret) {
    throw new Error("INGEST_SECRET is required for ingest (omit --dry-run to require it).");
  }

  console.log(`Posting ${payload.candidates.length} candidate(s) to ${ingestUrl} ...`);

  const body: IngestPayload = {
    ...(getScrapeUserId() ? { userId: getScrapeUserId() } : {}),
    ...payload,
  };

  const response = await fetch(ingestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ingest-secret": secret,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Ingest failed (${response.status}): ${body || response.statusText}`);
  }

  return readJsonResponse<IngestResponse>(response, "ingest");
}
