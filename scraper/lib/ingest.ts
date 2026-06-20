import type { IngestPayload, IngestResponse } from "../types.js";

const DEFAULT_INGEST_URL = "http://localhost:3000/api/ingest";

/** Always derive canonical ingest URLs from origin — avoids double /api paths. */
export function getIngestEndpoints(): {
  ingestUrl: string;
  knownIdsUrl: string;
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
  };
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
    const response = await fetch(knownIdsUrl, {
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

export async function ingestCandidates(payload: IngestPayload): Promise<IngestResponse> {
  const { ingestUrl } = getIngestEndpoints();
  const secret = process.env.INGEST_SECRET;

  if (!secret) {
    throw new Error("INGEST_SECRET is required for ingest (omit --dry-run to require it).");
  }

  console.log(`Posting ${payload.candidates.length} candidate(s) to ${ingestUrl} ...`);

  const response = await fetch(ingestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ingest-secret": secret,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Ingest failed (${response.status}): ${body || response.statusText}`);
  }

  return readJsonResponse<IngestResponse>(response, "ingest");
}
