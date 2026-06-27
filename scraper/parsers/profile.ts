import type { Page } from "playwright";
import type { ScrapeCandidate } from "../types.js";
import { dismissOverlays } from "../lib/auth.js";
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
    extractSingaporePhone(contactText) ??
    (await extractContactFromButton(page, { profileUrl: url, helperPlaceId }));
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

const CONTACT_BUTTON_SELECTORS = [
  "button.contact",
  "button.hp-apply-btn.contact",
  ".btn.hp-apply-btn.contact",
];

const CALL_WHATSAPP_SELECTORS = [
  ".contact-btn",
  'div.contact-btn:has-text("Call/Whatsapp")',
  'span.tab-font:has-text("Call/Whatsapp")',
  'a:has-text("Call/Whatsapp")',
  'button:has-text("Call/Whatsapp")',
  'a:has-text("Call/ WhatsApp")',
  'button:has-text("Call/ WhatsApp")',
  'a:has-text("Call")',
  'button:has-text("Call")',
  'a:has-text("WhatsApp")',
  'button:has-text("WhatsApp")',
];

const CALL_WHATSAPP_LABELS = [
  "Call/Whatsapp",
  "Call/ WhatsApp",
  "Call",
  "WhatsApp",
  "Phone",
];

async function extractContactFromButton(
  page: Page,
  context?: { profileUrl?: string; helperPlaceId?: string },
): Promise<string | undefined> {
  const logCtx = context?.helperPlaceId ?? context?.profileUrl ?? "unknown profile";

  const direct = await extractVisiblePhoneFromPage(page);
  if (direct) return direct;

  try {
    await dismissOverlays(page);

    let contactBtn = page.locator(CONTACT_BUTTON_SELECTORS[0]!).first();
    let contactFound = false;
    for (const selector of CONTACT_BUTTON_SELECTORS) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
        contactBtn = el;
        contactFound = true;
        break;
      }
    }
    if (
      !contactFound &&
      !(await contactBtn.isVisible({ timeout: 3_000 }).catch(() => false))
    ) {
      console.warn(`[contact] No contact button found for ${logCtx}`);
      return undefined;
    }

    await contactBtn.click({ force: true });
    await page.waitForTimeout(1_500);

    let clicked = await clickCallWhatsAppTab(page);
    if (!clicked) {
      await page.waitForTimeout(1_000);
      clicked = await clickCallWhatsAppTab(page);
    }
    if (!clicked) {
      console.warn(`[contact] Call/WhatsApp tab not found for ${logCtx}`);
      return undefined;
    }

    return await extractVisiblePhoneFromPage(page);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[contact] Extraction failed for ${logCtx}: ${message}`);
    return undefined;
  }
}

async function clickCallWhatsAppTab(page: Page): Promise<boolean> {
  for (const selector of CALL_WHATSAPP_SELECTORS) {
    const opt = page.locator(selector).first();
    if (await opt.isVisible({ timeout: 500 }).catch(() => false)) {
      await opt.click({ force: true });
      await page.waitForTimeout(1_500);
      return true;
    }
  }

  for (const label of CALL_WHATSAPP_LABELS) {
    const opt = page
      .locator("a, button, [role='button'], mat-list-item, .mat-menu-item")
      .filter({ hasText: new RegExp(label.replace("/", "\\/"), "i") })
      .first();
    if (await opt.isVisible({ timeout: 500 }).catch(() => false)) {
      await opt.click({ force: true });
      await page.waitForTimeout(1_500);
      return true;
    }
  }

  return false;
}

async function extractVisiblePhoneFromPage(page: Page): Promise<string | undefined> {
  const telLink = page.locator('a[href^="tel:"]').first();
  if (await telLink.isVisible({ timeout: 500 }).catch(() => false)) {
    const href = await telLink.getAttribute("href");
    if (href) {
      const fromHref = extractSingaporePhone(href.replace(/^tel:/i, ""));
      if (fromHref) return fromHref;
    }
    const text = await telLink.innerText().catch(() => "");
    const fromText = extractSingaporePhone(text);
    if (fromText) return fromText;
  }

  const waLink = page.locator('a[href*="wa.me"], a[href*="whatsapp"]').first();
  if (await waLink.isVisible({ timeout: 500 }).catch(() => false)) {
    const href = await waLink.getAttribute("href");
    if (href) {
      const fromHref = extractSingaporePhone(href);
      if (fromHref) return fromHref;
    }
  }

  const dialog = page.locator("mat-dialog-container, [role='dialog']").first();
  if (await dialog.isVisible({ timeout: 500 }).catch(() => false)) {
    const dialogText = await dialog.innerText().catch(() => "");
    const fromDialog = extractSingaporePhone(dialogText);
    if (fromDialog) return fromDialog;
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
          `${candidate.referenceLetterCount} ref letter(s)` +
          (candidate.phone ? `, phone ${candidate.phone}` : ", no phone"),
      );
      if (!candidate.phone) {
        console.warn(
          `[contact] No phone extracted for ${candidate.name} (${candidate.helperPlaceId}) — ${profileUrl}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${profileUrl}: ${message}`);
      console.error(`  ✗ ${profileUrl}: ${message}`);
    }

    await delay(delayMs);
  }

  return { candidates, errors };
}
