import type { IngestPayload } from "../types.js";
import { getIngestEndpoints } from "./ingest.js";

export interface RemoteScraperConfig {
  userId: string;
  helperPlaceEmail: string;
  helperPlacePassword: string;
  applicantsUrl: string;
}

export async function fetchRemoteScraperConfig(): Promise<RemoteScraperConfig | null> {
  const secret = process.env.INGEST_SECRET;
  const userId = process.env.SCRAPE_USER_ID?.trim();
  if (!secret || !userId) {
    return null;
  }

  const { scraperConfigUrl } = getIngestEndpoints();
  const url = `${scraperConfigUrl}?userId=${encodeURIComponent(userId)}`;
  console.log(`Loading HelperPlace credentials from dashboard for user ${userId} ...`);

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

export async function resolveScraperCredentials(): Promise<{
  email: string;
  password: string;
  applicantsUrl?: string;
  userId?: string;
}> {
  const remote = await fetchRemoteScraperConfig();
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
      "Missing credentials. Save HelperPlace credentials in Settings (with SCRAPE_USER_ID set) " +
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
