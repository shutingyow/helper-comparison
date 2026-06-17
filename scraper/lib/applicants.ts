import type { Locator, Page } from "playwright";
import { assertEmployerLoggedIn, isEmployerLoggedIn } from "./auth.js";
import { delay, normalizeProfileUrl } from "./utils.js";

const BASE_URL = "https://www.helperplace.com";

/** Default employer applicants list (Singapore) — must be logged in as employer */
export const DEFAULT_APPLICANTS_URL =
  "https://www.helperplace.com/find-candidate-singapore/applicant";

export const APPLIED_MARKER =
  /Applied\s+\d+\s*(?:sec(?:ond)?s?|min(?:ute)?s?|hours?|hrs?|days?|weeks?|months?)?\s*\.?\s*ago/i;

const CARD_ANCESTOR_XPATH =
  "xpath=ancestor::candidate-detail-block[1] | ancestor::div[contains(@class,'product-box-container')][1] | ancestor::article[1] | ancestor::li[1] | ancestor::div[contains(@class,'card')][1] | ancestor::div[contains(@class,'candidate')][1]";

const RESUME_LINK_SELECTOR = 'a[href*="/resume/singapore/"]';

const NEXT_PAGE_SELECTORS = [
  'a[rel="next"]',
  'button:has-text("Next")',
  'a:has-text("Next")',
  'li.next a',
  '.pagination a:has-text("›")',
  '.pagination a:has-text(">")',
  '[aria-label="Next"]',
  'a:has-text("»")',
  'button:has-text("Load more")',
  'a:has-text("Load more")',
];

export function isApplicantsListUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    return (
      path.includes("/applicant") ||
      path.includes("/application") ||
      path.includes("/applications")
    );
  } catch {
    return false;
  }
}

/** Public browse-all-candidates catalog (not your job applicants) */
export function isBrowseCatalogUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    if (isApplicantsListUrl(url)) return false;
    return (
      path === "/find-candidate" ||
      path === "/find-candidate-singapore" ||
      /^\/find-candidate-[^/]+\/?$/.test(path)
    );
  } catch {
    return false;
  }
}

export function isResumeProfileUrl(href: string): boolean {
  try {
    const url = new URL(href, BASE_URL);
    if (!url.pathname.includes("/resume/")) return false;
    return /\/resume\/singapore\//i.test(url.pathname);
  } catch {
    return false;
  }
}

export async function resolveApplicantsPage(
  page: Page,
  applicantsUrl?: string,
): Promise<string> {
  const target = applicantsUrl?.trim() || DEFAULT_APPLICANTS_URL;

  await assertEmployerLoggedIn(page);

  const strategies: Array<{ name: string; run: () => Promise<boolean> }> = [
    { name: "direct URL", run: () => gotoApplicantsUrl(page, target) },
    { name: "employer nav links", run: () => navigateViaApplicantNavLinks(page, target) },
    { name: "CANDIDATES menu", run: () => navigateViaCandidatesMenu(page, target) },
    { name: "manage-job page", run: () => navigateViaManageJob(page, target) },
    { name: "direct URL retry", run: () => gotoApplicantsUrl(page, target) },
  ];

  for (const strategy of strategies) {
    console.log(`  Trying navigation: ${strategy.name}...`);
    const ok = await strategy.run();
    if (!ok) continue;

    await ensureApplicantTab(page);

    if (await isOnEmployerApplicantsPage(page)) {
      console.log(`  Reached applicants list via ${strategy.name}.`);
      return page.url();
    }
  }

  const finalUrl = page.url();
  throw new Error(
    `Could not reach your applicants list (currently at ${finalUrl}). ` +
      `Expected employer page like ${DEFAULT_APPLICANTS_URL}. ` +
      "Verify HELPERPLACE_EMAIL / HELPERPLACE_PASSWORD and try HELPERPLACE_HEADLESS=false.",
  );
}

async function gotoApplicantsUrl(page: Page, target: string): Promise<boolean> {
  await page
    .goto(target, { waitUntil: "networkidle", timeout: 60_000 })
    .catch(() => page.goto(target, { waitUntil: "domcontentloaded", timeout: 60_000 }));
  await delay(2_500);
  return isApplicantsListUrl(page.url()) || (await isOnEmployerApplicantsPage(page));
}

async function navigateViaApplicantNavLinks(page: Page, target: string): Promise<boolean> {
  const selectors = [
    `a[href*="find-candidate-singapore/applicant"]`,
    `a[href*="/applicant"]`,
    `a[href="${target}"]`,
  ];

  for (const selector of selectors) {
    const link = page.locator(selector).first();
    const visible = await link.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!visible) continue;

    const href = (await link.getAttribute("href")) ?? target;
    await link.click().catch(() => gotoApplicantsUrl(page, href));
    await delay(2_500);
    if (isApplicantsListUrl(page.url()) || (await isOnEmployerApplicantsPage(page))) {
      return true;
    }
  }

  return gotoApplicantsUrl(page, target);
}

async function navigateViaCandidatesMenu(page: Page, target: string): Promise<boolean> {
  const candidatesNav = page
    .locator("nav a, header a, a")
    .filter({ hasText: /^Candidates$/i })
    .first();

  if (await candidatesNav.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await candidatesNav.click();
    await delay(2_500);
    if (isApplicantsListUrl(page.url()) || (await isOnEmployerApplicantsPage(page))) {
      return true;
    }
  }

  return gotoApplicantsUrl(page, target);
}

async function navigateViaManageJob(page: Page, target: string): Promise<boolean> {
  await page
    .goto(`${BASE_URL}/manage-job`, { waitUntil: "domcontentloaded", timeout: 60_000 })
    .catch(() => undefined);
  await delay(2_000);

  if (!(await isEmployerLoggedIn(page))) {
    return false;
  }

  const applicantLinks = page.locator(
    'a[href*="applicant"], a:has-text("Applicant"), a:has-text("View applicant"), button:has-text("Applicant")',
  );

  const count = await applicantLinks.count();
  for (let i = 0; i < count; i++) {
    const link = applicantLinks.nth(i);
    if (!(await link.isVisible({ timeout: 500 }).catch(() => false))) continue;

    const href = await link.getAttribute("href");
    if (href) {
      await gotoApplicantsUrl(page, href);
    } else {
      await link.click();
      await delay(2_500);
    }

    if (isApplicantsListUrl(page.url()) || (await isOnEmployerApplicantsPage(page))) {
      return true;
    }
  }

  return gotoApplicantsUrl(page, target);
}

/** Employer applicants view — Applicant tab with count, or "Applied X ago" cards. */
async function isOnEmployerApplicantsPage(page: Page): Promise<boolean> {
  if (isApplicantsListUrl(page.url())) {
    return true;
  }

  const applicantTab = page
    .locator('a, button, [role="tab"]')
    .filter({ hasText: /^Applicant\b/i })
    .first();

  if (await applicantTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
    const text = (await applicantTab.textContent()) ?? "";
    if (/\(\d+\)/.test(text)) {
      return true;
    }
  }

  if (await appliedLabels(page).first().isVisible({ timeout: 2_000 }).catch(() => false)) {
    return true;
  }

  return false;
}

/** Click the "Applicant" tab so we don't scrape Recommended (288) or All. */
async function ensureApplicantTab(page: Page): Promise<void> {
  const tab = page
    .locator('a, button, [role="tab"]')
    .filter({ hasText: /^Applicant\b/i })
    .first();

  const visible = await tab.isVisible({ timeout: 5_000 }).catch(() => false);
  if (!visible) return;

  const className = (await tab.getAttribute("class")) ?? "";
  const ariaSelected = await tab.getAttribute("aria-selected");
  if (ariaSelected === "true" || /active|selected/i.test(className)) {
    return;
  }

  await tab.click();
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  await delay(2_000);
  await appliedLabels(page)
    .first()
    .waitFor({ state: "visible", timeout: 20_000 })
    .catch(() => undefined);
}

async function getApplicantTabCount(page: Page): Promise<number | undefined> {
  const tab = page
    .locator('a, button, [role="tab"]')
    .filter({ hasText: /^Applicant\b/i })
    .first();

  const text = (await tab.textContent().catch(() => null)) ?? "";
  const match = text.match(/\((\d+)\)/);
  return match ? Number.parseInt(match[1]!, 10) : undefined;
}

function appliedLabels(page: Page) {
  return page.getByText(APPLIED_MARKER);
}

/** HelperPlace applicant rows are Angular `candidate-detail-block` custom elements. */
function applicantCards(page: Page) {
  return page.locator("candidate-detail-block").filter({ hasText: APPLIED_MARKER });
}

async function countApplicantCards(page: Page): Promise<number> {
  const cardCount = await applicantCards(page).count();
  if (cardCount > 0) return cardCount;
  return appliedLabels(page).count();
}

/** Scroll the list until lazy-loaded applicant cards stop appearing. */
async function loadAllApplicantCards(page: Page): Promise<void> {
  const expected = await getApplicantTabCount(page);
  if (expected) {
    console.log(`  Applicant tab shows ${expected} candidate(s).`);
  }

  let previousCount = 0;
  let stableRounds = 0;

  for (let round = 0; round < 40; round++) {
    await scrollApplicantList(page);
    await delay(900);

    const count = await countApplicantCards(page);
    if (expected && count >= expected) {
      console.log(`  Loaded ${count} applicant card(s) (matches tab count).`);
      return;
    }

    if (count === previousCount) {
      stableRounds++;
      if (stableRounds >= 4) {
        console.log(`  Loaded ${count} applicant card(s) (stable after scroll).`);
        return;
      }
    } else {
      stableRounds = 0;
      previousCount = count;
    }
  }

  const finalCount = await countApplicantCards(page);
  console.log(`  Loaded ${finalCount} applicant card(s) after max scroll rounds.`);
}

async function scrollApplicantList(page: Page): Promise<void> {
  await page.mouse.wheel(0, 2_500);
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    const main = document.querySelector("main");
    if (main instanceof HTMLElement) {
      main.scrollTop = main.scrollHeight;
    }
  });
}

/**
 * Collect profile URLs from applicant cards (those with "Applied X ago").
 * List view does not expose resume hrefs — click each card to capture the profile URL.
 */
export async function collectApplicantProfileUrls(page: Page): Promise<string[]> {
  const urls = new Set<string>();
  const maxPages = 20;
  const startUrl = page.url();

  if (!(await isOnEmployerApplicantsPage(page))) {
    console.warn(
      `Current page may not be an applicants list: ${startUrl}. ` +
        "Results might include non-applicants.",
    );
  }

  await ensureApplicantTab(page);

  const expected = await getApplicantTabCount(page);
  let previousPageCardCount = 0;

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await delay(1_000);
    await ensureApplicantTab(page);
    await loadAllApplicantCards(page);

    const cardCount = await countApplicantCards(page);
    if (cardCount === 0 && expected && expected > 0) {
      console.warn(
        `  No "Applied X ago" markers on page ${pageIndex + 1}, but Applicant tab shows ${expected}. ` +
          "Falling back to resume links in the main list.",
      );
      const fallback = await extractResumeLinksFromMainList(page);
      for (const url of fallback) {
        urls.add(url);
      }
      if (fallback.length > 0) break;
    }

    const before = urls.size;
    const pageUrls = await extractProfileUrlsByClickingCards(page, urls);

    console.log(
      `  Page ${pageIndex + 1}: ${pageUrls.length} profile URL(s) from cards (${urls.size - before} new, ${urls.size} total)`,
    );

    if (expected && urls.size >= expected) {
      console.log(`  Reached expected applicant count (${expected}).`);
      break;
    }

    if (pageIndex > 0 && cardCount <= previousPageCardCount && urls.size === before) {
      console.log("  No new profiles on this page — stopping pagination.");
      break;
    }
    previousPageCardCount = cardCount;

    const hasNext = await goToNextApplicantsPage(page);
    if (!hasNext) break;

    const nextUrl = page.url();
    if (isBrowseCatalogUrl(nextUrl) && !isApplicantsListUrl(nextUrl)) {
      console.warn(`Stopped pagination: next page left applicants list (${nextUrl})`);
      break;
    }
  }

  if (expected && urls.size < expected) {
    console.warn(
      `WARNING: Found ${urls.size} profile URL(s) but Applicant tab shows ${expected}. ` +
        "Some cards may not have navigated to a profile page.",
    );
  }

  return [...urls];
}

/** Fallback when per-card extraction fails — links live in candidate-detail-block, not always in main. */
async function extractResumeLinksFromMainList(page: Page): Promise<string[]> {
  const selectors = [
    `candidate-detail-block ${RESUME_LINK_SELECTOR}`,
    `.product-box-container ${RESUME_LINK_SELECTOR}`,
    `main ${RESUME_LINK_SELECTOR}`,
    RESUME_LINK_SELECTOR,
  ];

  for (const selector of selectors) {
    const hrefs = await page.locator(selector).evaluateAll((anchors) =>
      anchors
        .filter((anchor) => !anchor.closest("nav, header, footer"))
        .map((anchor) => (anchor as HTMLAnchorElement).href),
    );

    const normalized = [
      ...new Set(hrefs.filter(isResumeProfileUrl).map(normalizeProfileUrl)),
    ];
    if (normalized.length > 0) return normalized;
  }

  return [];
}

async function returnToApplicantsList(page: Page, listUrl: string): Promise<void> {
  if (isApplicantsListUrl(page.url()) && (await isOnEmployerApplicantsPage(page))) {
    return;
  }

  await page.goto(listUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await delay(1_500);
  await ensureApplicantTab(page);
}

async function extractResumeHrefFromCard(card: Locator): Promise<string | null> {
  const hrefs = await card.locator(RESUME_LINK_SELECTOR).evaluateAll((anchors) =>
    anchors.map((anchor) => (anchor as HTMLAnchorElement).href),
  );

  for (const href of hrefs) {
    if (isResumeProfileUrl(href)) {
      return normalizeProfileUrl(href);
    }
  }
  return null;
}

function describeLocator(locator: { toString(): string }): string {
  return locator.toString();
}

/**
 * Extract profile URLs from applicant cards. Resume hrefs are usually already
 * in each `candidate-detail-block`; click-through is only a fallback.
 */
async function extractProfileUrlsByClickingCards(
  page: Page,
  existing: Set<string>,
): Promise<string[]> {
  const found: string[] = [];
  const listUrl = page.url();
  const cards = applicantCards(page);
  let count = await cards.count();

  if (count === 0) {
    console.warn(
      "  No candidate-detail-block cards found; falling back to Applied-label iteration.",
    );
    return extractProfileUrlsViaAppliedLabels(page, existing);
  }

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    if (!(await card.isVisible({ timeout: 1_000 }).catch(() => false))) {
      console.warn(`  Card ${i}: not visible, skipping.`);
      continue;
    }

    const inlineHref = await extractResumeHrefFromCard(card);
    if (inlineHref) {
      if (!existing.has(inlineHref)) {
        existing.add(inlineHref);
        found.push(inlineHref);
      }
      continue;
    }

    await returnToApplicantsList(page, listUrl);
    count = await cards.count();
    if (i >= count) break;

    const refreshedCard = cards.nth(i);
    const clickTargets: Array<{ name: string; locator: ReturnType<typeof card.locator> }> = [
      { name: "resume link", locator: refreshedCard.locator(RESUME_LINK_SELECTOR).first() },
      { name: "profile image link", locator: refreshedCard.locator(".img-wrapper_Custom a").first() },
      { name: "product-box link", locator: refreshedCard.locator(".product-box a").first() },
      { name: "card image", locator: refreshedCard.locator("img").first() },
      { name: "card heading", locator: refreshedCard.locator("h2, h3, h4").first() },
      { name: "card body", locator: refreshedCard.locator(".product-box").first() },
    ];

    let clickedTarget: string | null = null;
    for (const { name, locator } of clickTargets) {
      if (!(await locator.isVisible({ timeout: 500 }).catch(() => false))) {
        continue;
      }
      const popupPromise = page.waitForEvent("popup", { timeout: 3_000 }).catch(() => null);
      await locator.click({ timeout: 8_000 }).catch(() => undefined);
      const popup = await popupPromise;
      if (popup) {
        await popup.waitForLoadState("domcontentloaded").catch(() => undefined);
        if (isResumeProfileUrl(popup.url())) {
          const normalized = normalizeProfileUrl(popup.url());
          if (!existing.has(normalized)) {
            existing.add(normalized);
            found.push(normalized);
          }
          await popup.close().catch(() => undefined);
          clickedTarget = `${name} (popup)`;
          break;
        }
        await popup.close().catch(() => undefined);
      }
      clickedTarget = name;
      break;
    }

    if (!clickedTarget) {
      const snippet = ((await refreshedCard.textContent()) ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      console.warn(
        `  Card ${i}: no clickable target (url=${page.url()}, snippet="${snippet}").`,
      );
      continue;
    }

    const navigated = await page
      .waitForURL(/\/resume\/singapore\//i, { timeout: 12_000 })
      .then(() => true)
      .catch(() => false);

    const afterUrl = page.url();
    if (navigated && isResumeProfileUrl(afterUrl)) {
      const normalized = normalizeProfileUrl(afterUrl);
      if (!existing.has(normalized)) {
        existing.add(normalized);
        found.push(normalized);
      }
    } else {
      console.warn(
        `  Card ${i}: click via "${clickedTarget}" did not reach resume ` +
          `(before=${listUrl}, after=${afterUrl}).`,
      );
    }

    await returnToApplicantsList(page, listUrl);
  }

  return found;
}

/** Legacy path when cards use a DOM shape without candidate-detail-block. */
async function extractProfileUrlsViaAppliedLabels(
  page: Page,
  existing: Set<string>,
): Promise<string[]> {
  const found: string[] = [];
  const listUrl = page.url();
  const count = await appliedLabels(page).count();

  for (let i = 0; i < count; i++) {
    await returnToApplicantsList(page, listUrl);

    const label = appliedLabels(page).nth(i);
    if (!(await label.isVisible({ timeout: 1_000 }).catch(() => false))) {
      continue;
    }

    const card = label.locator(CARD_ANCESTOR_XPATH);
    if ((await card.count()) === 0) {
      console.warn(
        `  Applied label ${i}: CARD_ANCESTOR_XPATH matched 0 ancestors ` +
          `(label=${describeLocator(label)}).`,
      );
      continue;
    }

    const inlineHref = await extractResumeHrefFromCard(card);
    if (inlineHref) {
      if (!existing.has(inlineHref)) {
        existing.add(inlineHref);
        found.push(inlineHref);
      }
      continue;
    }

    const resumeLink = card.locator(RESUME_LINK_SELECTOR).first();
    if (await resumeLink.isVisible({ timeout: 500 }).catch(() => false)) {
      await resumeLink.click({ timeout: 8_000 }).catch(() => undefined);
    } else {
      console.warn(`  Applied label ${i}: no resume link in card, skipping click.`);
      continue;
    }

    const navigated = await page
      .waitForURL(/\/resume\/singapore\//i, { timeout: 12_000 })
      .then(() => true)
      .catch(() => false);

    if (navigated && isResumeProfileUrl(page.url())) {
      const normalized = normalizeProfileUrl(page.url());
      if (!existing.has(normalized)) {
        existing.add(normalized);
        found.push(normalized);
      }
    } else {
      console.warn(
        `  Applied label ${i}: click did not navigate to resume (after=${page.url()}).`,
      );
    }

    await returnToApplicantsList(page, listUrl);
  }

  return found;
}

async function findNextPageHref(page: Page): Promise<string | null> {
  const relNext = page.locator('a[rel="next"]').first();
  if (await relNext.isVisible({ timeout: 500 }).catch(() => false)) {
    const className = (await relNext.getAttribute("class")) ?? "";
    const ariaDisabled = await relNext.getAttribute("aria-disabled");
    if (!className.includes("disabled") && ariaDisabled !== "true") {
      const href = await relNext.getAttribute("href");
      if (href) return new URL(href, BASE_URL).toString();
    }
  }

  for (const selector of NEXT_PAGE_SELECTORS) {
    const next = page.locator(selector).first();
    const visible = await next.isVisible({ timeout: 500 }).catch(() => false);
    if (!visible) continue;

    const className = (await next.getAttribute("class")) ?? "";
    const ariaDisabled = await next.getAttribute("aria-disabled");
    const parentClass =
      (await next
        .locator("xpath=ancestor::li[1]")
        .getAttribute("class")
        .catch(() => null)) ?? "";
    if (
      className.includes("disabled") ||
      ariaDisabled === "true" ||
      parentClass.includes("disabled")
    ) {
      return null;
    }

    const href = await next.getAttribute("href");
    if (href) return new URL(href, BASE_URL).toString();
  }

  const paginationLinks = page.locator(
    '.pagination a, [class*="pagination"] a, ul.flex a[href*="page="]',
  );
  const linkCount = await paginationLinks.count();
  let currentPage = 1;

  try {
    const current = new URL(page.url());
    const pageParam = current.searchParams.get("page");
    if (pageParam) currentPage = Number.parseInt(pageParam, 10);
  } catch {
    // ignore
  }

  for (let i = 0; i < linkCount; i++) {
    const link = paginationLinks.nth(i);
    const text = ((await link.textContent()) ?? "").trim();
    const href = await link.getAttribute("href");
    if (!href) continue;

    const pageNum = Number.parseInt(text, 10);
    if (pageNum === currentPage + 1) {
      return new URL(href, BASE_URL).toString();
    }
  }

  return null;
}

async function goToNextApplicantsPage(page: Page): Promise<boolean> {
  const beforeUrl = page.url();
  const nextHref = await findNextPageHref(page);

  if (!nextHref || nextHref === beforeUrl) {
    return false;
  }

  await page
    .goto(nextHref, { waitUntil: "domcontentloaded", timeout: 60_000 })
    .catch(() => undefined);
  await delay(1_500);
  await ensureApplicantTab(page);

  if (page.url() === beforeUrl) {
    return false;
  }

  return true;
}
