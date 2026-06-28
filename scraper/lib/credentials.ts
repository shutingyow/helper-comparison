import { getIngestEndpoints } from "./ingest.js";

export interface RemoteScraperConfig {
  userId: string;
  helperPlaceEmail: string;
  helperPlacePassword: string;
  applicantsUrl: string;
}

export interface ScrapeTarget {
  userId: string;
}

export async function fetchScrapeTargets(): Promise<ScrapeTarget[]> {
  const secret = process.env.INGEST_SECRET;
  if (!secret) {
    throw new Error("INGEST_SECRET is required to list scrape targets.");
  }

  const { scraperTargetsUrl } = getIngestEndpoints();
  console.log(`Fetching scrape targets from ${scraperTargetsUrl} ...`);

  const response = await fetch(scraperTargetsUrl, {
    headers: { "x-ingest-secret": secret },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Could not fetch scrape targets (HTTP ${response.status}). ${body.slice(0, 200)}`,
    );
  }

  const body = (await response.json()) as { targets?: ScrapeTarget[] };
  return body.targets ?? [];
}

export async function fetchRemoteScraperConfig(userId?: string): Promise<RemoteScraperConfig | null> {
  const secret = process.env.INGEST_SECRET;
  const resolvedUserId = userId ?? process.env.SCRAPE_USER_ID?.trim();
  if (!secret || !resolvedUserId) {
    return null;
  }

  const { scraperConfigUrl } = getIngestEndpoints();
  const url = `${scraperConfigUrl}?userId=${encodeURIComponent(resolvedUserId)}`;
  console.log(`Loading HelperPlace credentials from dashboard for user ${resolvedUserId} ...`);

  const response = await fetch(url, {
    headers: { "x-ingest-secret": secret },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.warn(
      `Could not load remote scraper config (HTTP ${response.status}). ` +
        `Falling back to HELPERPLACE_* env vars. ${body.slice(0, 200)}`,
    );
    return null;
  }

  return (await response.json()) as RemoteScraperConfig;
}

export async function resolveScraperCredentials(userId?: string): Promise<{
  email: string;
  password: string;
  applicantsUrl?: string;
  userId?: string;
}> {
  const remote = await fetchRemoteScraperConfig(userId);
  if (remote) {
    return {
      email: remote.helperPlaceEmail,
      password: remote.helperPlacePassword,
      applicantsUrl: remote.applicantsUrl,
      userId: remote.userId,
    };
  }

  const email = process.env.HELPERPLACE_EMAIL;
  const password = process.env.HELPERPLACE_PASSWORD;
  const applicantsUrl =
    process.env.HELPERPLACE_APPLICANTS_URL?.trim() ||
    process.env.HELPERPLACE_JOB_URL?.trim() ||
    undefined;

  if (!email || !password) {
    throw new Error(
      "Missing credentials. Save HelperPlace credentials in Settings, set SCRAPE_USER_ID for a single user, " +
        "or set HELPERPLACE_EMAIL and HELPERPLACE_PASSWORD in the scraper environment.",
    );
  }

  return {
    email,
    password,
    applicantsUrl,
    userId: process.env.SCRAPE_USER_ID?.trim(),
  };
}
