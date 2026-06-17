import type { Page } from "playwright";
import type { ScrapeCandidate } from "../types.js";
import {
  delay,
  extractHelperPlaceId,
  extractSingaporePhone,
  normalizeProfileUrl,
  parseAge,
  parseYears,
} from "../lib/utils.js";
import {
  parseEducation,
  parseExpectations,
  parseSectionFromHeadingLines,
  parseSkillsSection,
  parseWorkHistory,
} from "./profileParse.js";

const SECTION_HEADINGS = {
  professional: /^professional\s*info$/i,
  skills: /^skills\s*\/?\s*duties$/i,
  about: /^about\s*me$/i,
  work: /^work\s*experience$/i,
  education: /^education$/i,
  expectations: /^my\s*expectations$/i,
};

export async function parseProfilePage(
  page: Page,
  profileUrl: string,
  options?: { includeRawHtml?: boolean },
): Promise<ScrapeCandidate> {
  const url = normalizeProfileUrl(profileUrl);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(2_000);

  const scrapedAt = Date.now();
  const helperPlaceId = extractHelperPlaceId(url);

  const bodyLines = ((await page.locator("body").innerText()).split("\n")).map((l) => l.trim());

  const professionalText = parseSectionFromHeadingLines(bodyLines, SECTION_HEADINGS.professional);
  const skillsText = parseSectionFromHeadingLines(bodyLines, SECTION_HEADINGS.skills);
  const aboutMe = cleanText(parseSectionFromHeadingLines(bodyLines, SECTION_HEADINGS.about));
  const workText = parseSectionFromHeadingLines(bodyLines, SECTION_HEADINGS.work);
  const educationText = parseSectionFromHeadingLines(bodyLines, SECTION_HEADINGS.education);
  const expectationsText = parseSectionFromHeadingLines(bodyLines, SECTION_HEADINGS.expectations);

  const name = await extractName(page);
  const headerText = await extractHeaderText(page);
  const age = parseAge(headerText) ?? parseAge(bodyLines.join("\n"));
  const { gender, nationality } = parseHeaderMeta(headerText);

  const contractStatus = extractLabeledValue(professionalText, /Domestic Helper\s*\|\s*(.+)/i);
  const presentLocation = extractLabeledValue(professionalText, /Present Location:\s*(.+)/i);
  const yearsExperience =
    parseYears(professionalText) ?? parseYears(bodyLines.join("\n"));
  const availableFrom = extractLabeledValue(
    professionalText,
    /Start from\s+(.+?)(?:\s*\|\s*|$)/im,
  );

  const skillGroups = parseSkillsSection(skillsText);
  const allSkills = dedupe([
    ...skillGroups.skills,
    ...skillGroups.cookingSkills,
  ]);
  const workHistory = parseWorkHistory(workText);
  const referenceLetterCount = workHistory.filter((w) => w.hasReferenceLetter).length;
  const hasReferenceLetter = referenceLetterCount > 0;

  const expectations = parseExpectations(expectationsText);
  const education = parseEducation(educationText);

  const bodyText = bodyLines.join("\n");
  const contactText = [aboutMe ?? "", bodyText].join("\n");
  const phone =
    extractSingaporePhone(contactText) ?? (await extractContactFromButton(page));
  const whatsapp = phone;

  const candidate: ScrapeCandidate = {
    helperPlaceId,
    profileUrl: url,
    name,
    age,
    gender,
    nationality,
    contractStatus: contractStatus?.trim(),
    presentLocation: presentLocation?.trim(),
    yearsExperience,
    availableFrom: availableFrom?.trim(),
    skills: allSkills,
    languages: skillGroups.languages,
    cookingSkills: skillGroups.cookingSkills,
    personalityTraits: skillGroups.personalityTraits,
    hasReferenceLetter,
    referenceLetterCount,
    workHistory,
    aboutMe,
    education,
    salaryExpectation: expectations.salaryExpectation,
    accommodation: expectations.accommodation,
    dayOff: expectations.dayOff,
    phone,
    whatsapp,
    scrapedAt,
  };

  if (options?.includeRawHtml) {
    candidate.rawHtml = await page.content();
  }

  return candidate;
}

async function extractName(page: Page): Promise<string> {
  const selectors = ["h1", '[class*="candidate-name"]', '[class*="profile-name"]', ".resume h1"];
  for (const selector of selectors) {
    const text = cleanText(await page.locator(selector).first().innerText().catch(() => ""));
    if (text && text.length < 80 && !/years/i.test(text)) return text;
  }
  const title = await page.title();
  const fromTitle = title.match(/Candidate Profile\s*-\s*([^|]+)/i);
  return fromTitle?.[1]?.trim() ?? "Unknown";
}

async function extractHeaderText(page: Page): Promise<string> {
  const h1 = page.locator("h1").first();
  const headerBlock = h1.locator("xpath=following-sibling::*[position()<=3]").first();
  const text = await headerBlock.innerText().catch(() => "");
  if (text.includes("|")) return text;

  const bodyStart = (await page.locator("body").innerText()).slice(0, 800);
  return bodyStart;
}

function parseHeaderMeta(headerText: string): { gender?: string; nationality?: string } {
  const pipeLine = headerText
    .split("\n")
    .find((line) => line.includes("|") && /male|female/i.test(line));

  if (!pipeLine) return {};

  const parts = pipeLine.split("|").map((p) => p.trim());
  const gender = parts.find((p) => /^(male|female)$/i.test(p));
  const nationality = parts.find((p) =>
    /^(filipino|indonesian|myanmar|indian|sri lankan|bangladeshi|nepalese|thai|vietnamese|chinese|malaysian)/i.test(
      p,
    ),
  );

  return { gender, nationality };
}

function extractLabeledValue(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern);
  return match?.[1]?.trim();
}

async function extractContactFromButton(page: Page): Promise<string | undefined> {
  const contactSelectors = [
    'a[href^="tel:"]',
    'a[href*="whatsapp"]',
    'a[href*="wa.me"]',
    'button:has-text("Contact")',
    'a:has-text("Contact")',
  ];

  for (const selector of contactSelectors) {
    const el = page.locator(selector).first();
    if (!(await el.isVisible({ timeout: 500 }).catch(() => false))) continue;

    const href = await el.getAttribute("href");
    if (href?.startsWith("tel:")) {
      return extractSingaporePhone(href.replace("tel:", ""));
    }
    if (href?.includes("whatsapp") || href?.includes("wa.me")) {
      return extractSingaporePhone(href);
    }
  }

  return undefined;
}

function cleanText(value: string): string | undefined {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || undefined;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

export async function parseProfilesWithRateLimit(
  page: Page,
  profileUrls: string[],
  delayMs = 1_500,
): Promise<{ candidates: ScrapeCandidate[]; errors: string[] }> {
  const candidates: ScrapeCandidate[] = [];
  const errors: string[] = [];

  for (const profileUrl of profileUrls) {
    try {
      const candidate = await parseProfilePage(page, profileUrl);
      candidates.push(candidate);
      console.log(
        `  ✓ ${candidate.name} (${candidate.helperPlaceId}) — ` +
          `${candidate.skills.length} skills, ${candidate.workHistory.length} jobs, ` +
          `${candidate.referenceLetterCount} ref letter(s)`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${profileUrl}: ${message}`);
      console.error(`  ✗ ${profileUrl}: ${message}`);
    }

    await delay(delayMs);
  }

  return { candidates, errors };
}
