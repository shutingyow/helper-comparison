import type { IngestPayload, IngestResponse } from "../types.js";

const DEFAULT_INGEST_URL = "http://localhost:3000/api/ingest";

function ingestBaseUrl(): string {
  const ingestUrl = process.env.INGEST_URL ?? DEFAULT_INGEST_URL;
  return ingestUrl.replace(/\/ingest\/?$/, "");
}

export async function fetchKnownHelperPlaceIds(): Promise<Set<string>> {
  const secret = process.env.INGEST_SECRET;
  if (!secret) {
    return new Set();
  }

  const url = `${ingestBaseUrl()}/api/ingest/known-ids`;
  const response = await fetch(url, {
    headers: { "x-ingest-secret": secret },
  });

  if (!response.ok) {
    console.warn(
      `Could not fetch known candidate IDs (${response.status}) — parsing all profiles.`,
    );
    return new Set();
  }

  const body = (await response.json()) as { helperPlaceIds?: string[] };
  return new Set(body.helperPlaceIds ?? []);
}

export async function ingestCandidates(payload: IngestPayload): Promise<IngestResponse> {
  const ingestUrl = process.env.INGEST_URL ?? DEFAULT_INGEST_URL;
  const secret = process.env.INGEST_SECRET;

  if (!secret) {
    throw new Error("INGEST_SECRET is required for ingest (omit --dry-run to require it).");
  }

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

  return (await response.json()) as IngestResponse;
}
