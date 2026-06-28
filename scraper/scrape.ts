#!/usr/bin/env node
import { config } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { assertEmployerLoggedIn, login } from "./lib/auth.js";
import { collectApplicantProfileUrls, resolveApplicantsPage } from "./lib/applicants.js";
import { fetchKnownHelperPlaceIds, fetchMissingPhoneCandidates, ingestCandidates } from "./lib/ingest.js";
import { fetchScrapeTargets, resolveScraperCredentials } from "./lib/credentials.js";
import { parseProfilesWithRateLimit } from "./parsers/profile.js";
import { extractHelperPlaceId, normalizeProfileUrl } from "./lib/utils.js";
import type { IngestPayload, ScrapeRun } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.join(__dirname, ".env") });
config({ path: path.join(__dirname, "..", ".env") });

const PROFILE_DELAY_MS = 1_500;

function parseUserIdArg(): string | undefined {
  const flag = process.argv.find((arg) => arg.startsWith("--user-id="));
  return flag?.slice("--user-id=".length).trim() || undefined;
}

async function runScrapeOnce(options: {
  dryRun: boolean;
  fullScrape: boolean;
  userId?: string;
}): Promise<void> {
  if (options.userId) {
    process.env.SCRAPE_USER_ID = options.userId;
  }

  const credentials = await resolveScraperCredentials(options.userId);
  if (credentials.userId) {
    process.env.SCRAPE_USER_ID = credentials.userId;
  }

  const email = credentials.email;
  const password = credentials.password;
  const applicantsUrl = credentials.applicantsUrl;

  if (!email || !password) {
    console.error("Missing HelperPlace credentials.");
    process.exit(1);
  }

  const startedAt = Date.now();
  const errors: string[] = [];
  const headless = process.env.HELPERPLACE_HEADLESS !== "false";
  const browser = await chromium.launch({ headless, slowMo: headless ? 0 : 50 });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
    locale: "en-SG",
  });
  const page = await context.newPage();

  try {
    console.log("Logging in to HelperPlace...");
    await login(page, email, password, { afterLoginUrl: applicantsUrl });
    await assertEmployerLoggedIn(page, applicantsUrl);
    console.log("Logged in as employer.");

    console.log("Navigating to applicants...");
    const resolvedUrl = await resolveApplicantsPage(page, applicantsUrl);
    console.log(`Applicants page: ${resolvedUrl}`);

    console.log("Collecting profile URLs (with pagination)...");
    const profileUrls = await collectApplicantProfileUrls(page);
    console.log(`Found ${profileUrls.length} candidate profile(s) on your applicants list.`);

    let urlsToParse = profileUrls;
    if (!options.fullScrape && !options.dryRun) {
      const knownIds = await fetchKnownHelperPlaceIds();
      const missingPhoneCandidates = await fetchMissingPhoneCandidates();
      const missingPhoneIds = new Set(
        missingPhoneCandidates.map((candidate) => candidate.helperPlaceId),
      );

      const urlSet = new Set<string>();
      for (const url of profileUrls) {
        const id = extractHelperPlaceId(url);
        if (!knownIds.has(id) || missingPhoneIds.has(id)) {
          urlSet.add(normalizeProfileUrl(url));
        }
      }

      let directBackfillCount = 0;
      for (const candidate of missingPhoneCandidates) {
        const normalized = normalizeProfileUrl(candidate.profileUrl);
        if (!urlSet.has(normalized)) {
          urlSet.add(normalized);
          directBackfillCount += 1;
        }
      }

      urlsToParse = [...urlSet];
      const newCount = profileUrls.filter(
        (url) => !knownIds.has(extractHelperPlaceId(url)),
      ).length;
      const backfillCount = urlsToParse.length - newCount;
      console.log(
        `${urlsToParse.length} profile(s) to parse (${newCount} new, ${backfillCount} phone backfill including ${directBackfillCount} direct from dashboard, ${knownIds.size} already in dashboard).`,
      );
    } else if (options.fullScrape) {
      console.log("Full scrape: parsing all profiles (updates existing records too).");
    }

    if (urlsToParse.length === 0 && profileUrls.length > 0) {
      console.log("No new applicants and no phone backfill needed — dashboard is up to date.");
      if (!options.dryRun) {
        const scrapeRun: ScrapeRun = {
          startedAt,
          finishedAt: Date.now(),
        };
        await ingestCandidates({ candidates: [], scrapeRun });
      }
      return;
    }

    if (profileUrls.length === 0) {
      errors.push(
        "No applicant profile URLs found. Set HELPERPLACE_APPLICANTS_URL to your job applicants page.",
      );
    }

    console.log("Parsing profiles...");
    const { candidates, errors: parseErrors } = await parseProfilesWithRateLimit(
      page,
      urlsToParse,
      PROFILE_DELAY_MS
    );
    errors.push(...parseErrors);

    const scrapeRun: ScrapeRun = {
      startedAt,
      finishedAt: Date.now(),
      ...(errors.length > 0 ? { errors } : {}),
    };

    const payload: IngestPayload = { candidates, scrapeRun };

    if (options.dryRun) {
      const outputDir = path.join(__dirname, "output");
      await mkdir(outputDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const outputPath = path.join(outputDir, `scrape-${timestamp}.json`);
      await writeFile(outputPath, JSON.stringify(payload, null, 2), "utf-8");
      console.log(`\nDry run complete. Wrote ${candidates.length} candidate(s) to:\n  ${outputPath}`);
      if (errors.length > 0) {
        console.log(`\n${errors.length} error(s) during scrape.`);
      }
      return;
    }

    console.log("\nPosting to ingest API...");
    const result = await ingestCandidates(payload);
    console.log(`Ingest complete: ${result.newCount} new, ${result.updatedCount} updated.`);

    if (errors.length > 0) {
      console.log(`${errors.length} non-fatal error(s) recorded in scrapeRun.`);
    }
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const fullScrape = process.argv.includes("--full");
  const allUsers = process.argv.includes("--all-users");
  const userIdArg = parseUserIdArg();

  if (allUsers) {
    const targets = await fetchScrapeTargets();
    if (targets.length === 0) {
      console.log("No users with scrape enabled.");
      return;
    }
    console.log(`Scraping ${targets.length} user(s)...`);
    for (const target of targets) {
      console.log(`\n=== User ${target.userId} ===`);
      await runScrapeOnce({ dryRun, fullScrape, userId: target.userId });
    }
    return;
  }

  await runScrapeOnce({ dryRun, fullScrape, userId: userIdArg });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
