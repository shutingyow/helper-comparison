import type { Page } from "playwright";
import { delay } from "./utils.js";
import {
  DEFAULT_APPLICANTS_URL,
  isBrowseCatalogUrl,
  isEmployerLandingUrl,
  resolveEmployerApplicantsUrl,
} from "./urls.js";

const BASE_URL = "https://www.helperplace.com";
const LOGIN_URL = `${BASE_URL}/login`;

const EMAIL_SELECTORS = [
  "#username",
  'input[name="username"]',
  'input[placeholder*="Email"]',
  'input[placeholder*="email" i]',
  'input[type="email"]',
  'input[name="email"]',
  'input[autocomplete="username"]',
];

const SUBMIT_SELECTORS = [
  'button[type="submit"]',
  'button:has-text("log in")',
  'button:has-text("Log in")',
  'button:has-text("Login")',
  'button:has-text("Sign in")',
  'input[type="submit"]',
];

type LoginStep =
  | "navigate"
  | "form-not-found"
  | "form-not-ready"
  | "fill-failed"
  | "submit-not-found"
  | "submit-failed"
  | "session-not-established";

export async function login(
  page: Page,
  email: string,
  password: string,
  options?: { afterLoginUrl?: string },
): Promise<void> {
  const failures: string[] = [];

  const attempts: Array<{ label: string; run: () => Promise<boolean> }> = [
    {
      label: LOGIN_URL,
      run: () => loginOnPage(page, email, password, LOGIN_URL),
    },
    {
      label: `${BASE_URL} (login popup)`,
      run: () => loginViaHomepagePopup(page, email, password),
    },
  ];

  for (const attempt of attempts) {
    try {
      if (await attempt.run()) {
        await establishEmployerSession(page, options?.afterLoginUrl);
        if (await isEmployerLoggedIn(page)) {
          return;
        }
        failures.push(
          `${attempt.label}: login form submitted but employer session was not established ` +
            `(currently at ${page.url()}).`,
        );
      } else {
        failures.push(`${attempt.label}: login session was not established after submit`);
      }
    } catch (error) {
      const step = error instanceof LoginStepError ? error.step : "unknown";
      const detail = error instanceof Error ? error.message : String(error);
      failures.push(`${attempt.label}: failed at ${step} — ${detail}`);
    }
  }

  throw new Error(
    "HelperPlace login failed.\n" +
      failures.map((line) => `  • ${line}`).join("\n") +
      "\nCredentials may still be correct — the Angular login form may not have been ready. " +
      "Try HELPERPLACE_HEADLESS=false to watch the browser.",
  );
}

/** True when logged in as an employer (not the public catalog visitor). */
export async function isEmployerLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();

  if (url.includes("/login")) {
    return false;
  }

  if (isBrowseCatalogUrl(url)) {
    return false;
  }

  if (isEmployerLandingUrl(url)) {
    return true;
  }

  const loginCta = page
    .locator("a, button")
    .filter({ hasText: /^Log\s*in$|^Login$/i })
    .first();
  if (await loginCta.isVisible({ timeout: 1_500 }).catch(() => false)) {
    return false;
  }

  const employerSignals = [
    page.locator('a, button').filter({ hasText: /manage\s*job/i }).first(),
    page.locator('a[href*="manage-job"]').first(),
    page.locator('a[href*="dashboard"]').first(),
    page.locator('a[href*="logout"]').first(),
    page.locator('a, button').filter({ hasText: /log\s*out/i }).first(),
    page.locator('a[href*="applicant"]').first(),
    page.locator('a, button, [role="tab"]').filter({ hasText: /^Applicant\b/i }).first(),
  ];

  for (const signal of employerSignals) {
    if (await signal.isVisible({ timeout: 2_000 }).catch(() => false)) {
      return true;
    }
  }

  return false;
}

export async function assertEmployerLoggedIn(
  page: Page,
  afterLoginUrl?: string,
): Promise<void> {
  if (await isEmployerLoggedIn(page)) {
    return;
  }

  if (await waitForEmployerSession(page)) {
    return;
  }

  await establishEmployerSession(page, afterLoginUrl);

  if (await isEmployerLoggedIn(page)) {
    return;
  }

  const url = page.url();
  const hint = isBrowseCatalogUrl(url)
    ? "The saved applicants URL may be the public candidate catalog (e.g. /find-candidate). " +
      `Update Settings to your job applicants page (e.g. ${DEFAULT_APPLICANTS_URL}). `
    : "";
  throw new Error(
    "HelperPlace employer verification failed after login. " +
      `Current URL: ${url}. ` +
      hint +
      "Expected employer nav (e.g. Manage Job, Dashboard, Applicants). " +
      "The scraper may have hit the public candidate catalog instead.",
  );
}

class LoginStepError extends Error {
  constructor(
    readonly step: LoginStep,
    message: string,
  ) {
    super(message);
    this.name = "LoginStepError";
  }
}

async function loginOnPage(
  page: Page,
  email: string,
  password: string,
  url: string,
): Promise<boolean> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await dismissOverlays(page);
  await waitForLoginFormReady(page);

  const filled = await fillLoginForm(page, email, password);
  if (!filled) {
    throw new LoginStepError(
      "form-not-found",
      "Could not find or fill the username/password fields on the login page.",
    );
  }

  const submitted = await submitLogin(page);
  if (!submitted) {
    throw new LoginStepError(
      "submit-not-found",
      'Could not find a "log in" submit button on the login page.',
    );
  }

  if (!(await waitForLoginComplete(page))) {
    const inlineError = await readInlineLoginError(page);
    throw new LoginStepError(
      "session-not-established",
      inlineError ??
        "Still on the login page after submit (credentials rejected or form did not register input).",
    );
  }

  return true;
}

async function loginViaHomepagePopup(
  page: Page,
  email: string,
  password: string,
): Promise<boolean> {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await dismissOverlays(page);

  const popupLogin = page.locator("a.popup-button-login, .popup-button-login").first();
  const popupVisible = await popupLogin.isVisible({ timeout: 3_000 }).catch(() => false);
  if (!popupVisible) {
    throw new LoginStepError(
      "form-not-found",
      'Homepage "Login" popup trigger is not visible (layout may be mobile-only).',
    );
  }

  await popupLogin.click({ force: true });
  await waitForLoginFormReady(page);

  const filled = await fillLoginForm(page, email, password);
  if (!filled) {
    throw new LoginStepError("form-not-found", "Login popup opened but username/password fields were not found.");
  }

  const submitted = await submitLogin(page);
  if (!submitted) {
    throw new LoginStepError("submit-not-found", "Login popup opened but no submit button was found.");
  }

  return waitForLoginComplete(page);
}

export async function dismissOverlays(page: Page): Promise<void> {
  const cookieSelectors = [
    'a.allow-btn:has-text("Accept all cookies")',
    'button:has-text("Accept all cookies")',
    'button:has-text("Accept")',
    'button:has-text("Accept all")',
    'button:has-text("I agree")',
    'button:has-text("Got it")',
    '[class*="cookie"] button:has-text("Accept")',
  ];

  for (const selector of cookieSelectors) {
    const button = page.locator(selector).first();
    if (await button.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await button.click().catch(() => undefined);
      await delay(500);
      return;
    }
  }
}

async function waitForLoginFormReady(page: Page): Promise<void> {
  const username = page.locator("#username, input[name='username']").first();
  const password = page.locator("#password, input[type='password']").first();

  try {
    await username.waitFor({ state: "visible", timeout: 10_000 });
    await password.waitFor({ state: "visible", timeout: 10_000 });
  } catch {
    throw new LoginStepError(
      "form-not-ready",
      "Login form fields did not become visible in time (page may still be loading).",
    );
  }

  // Angular Material binds ngModel after hydration; filling too early leaves email empty.
  await delay(1_500);
}

async function fillLoginForm(page: Page, email: string, password: string): Promise<boolean> {
  const passwordInput = page.locator("#password, input[type='password']").first();
  if (!(await passwordInput.isVisible({ timeout: 3_000 }).catch(() => false))) {
    return false;
  }

  let emailInput = null;
  for (const selector of EMAIL_SELECTORS) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 1_000 }).catch(() => false)) {
      emailInput = el;
      break;
    }
  }

  if (!emailInput) {
    return false;
  }

  await emailInput.click();
  await emailInput.fill("");
  await emailInput.fill(email);

  await passwordInput.click();
  await passwordInput.fill("");
  await passwordInput.fill(password);

  const values = await page.evaluate(() => {
    const username = document.querySelector<HTMLInputElement>("#username, input[name='username']");
    const password = document.querySelector<HTMLInputElement>("#password, input[type='password']");
    return {
      emailLength: username?.value?.length ?? 0,
      passwordLength: password?.value?.length ?? 0,
    };
  });

  if (values.emailLength === 0 || values.passwordLength === 0) {
    // Fallback for Angular fields that ignore programmatic fill.
    await emailInput.click();
    await emailInput.pressSequentially(email, { delay: 25 });
    await passwordInput.click();
    await passwordInput.pressSequentially(password, { delay: 25 });

    const retryValues = await page.evaluate(() => {
      const username = document.querySelector<HTMLInputElement>("#username, input[name='username']");
      const password = document.querySelector<HTMLInputElement>("#password, input[type='password']");
      return {
        emailLength: username?.value?.length ?? 0,
        passwordLength: password?.value?.length ?? 0,
      };
    });

    if (retryValues.emailLength === 0 || retryValues.passwordLength === 0) {
      throw new LoginStepError(
        "fill-failed",
        "Filled login fields but Angular did not register the email/password values.",
      );
    }
  }

  return true;
}

async function submitLogin(page: Page): Promise<boolean> {
  for (const selector of SUBMIT_SELECTORS) {
    const btn = page.locator(selector).first();
    if (!(await btn.isVisible({ timeout: 1_000 }).catch(() => false))) {
      continue;
    }

    await Promise.all([
      page
        .waitForURL(
          (url) =>
            url.pathname.includes("/dashboard") ||
            (!url.pathname.includes("/login") && url.origin === new URL(BASE_URL).origin),
          { timeout: 25_000 },
        )
        .catch(() => undefined),
      btn.click(),
    ]);
    await delay(1_500);
    return true;
  }

  return false;
}

async function readInlineLoginError(page: Page): Promise<string | null> {
  const errors = await page
    .locator("mat-error, .alert, .alert-danger, [class*='error-message']")
    .allTextContents()
    .catch(() => []);

  const cleaned = errors.map((text) => text.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.join("; ") : null;
}

async function waitForLoginComplete(page: Page): Promise<boolean> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const url = page.url();
    const onLoginPage = url.includes("/login");
    const onEmployerLanding = isEmployerLandingUrl(url);
    const loginFormVisible = await page
      .locator("#password, input[type='password']")
      .isVisible({ timeout: 500 })
      .catch(() => false);

    if (onEmployerLanding) {
      await delay(1_000);
      return true;
    }

    if (!onLoginPage && !loginFormVisible) {
      if (await isEmployerLoggedIn(page)) {
        await delay(1_000);
        return true;
      }

      if (isBrowseCatalogUrl(url)) {
        // Leaving the login form for the public catalog is not an employer session.
        return false;
      }
    }

    const inlineError = await readInlineLoginError(page);
    if (inlineError && /invalid|incorrect|wrong|failed/i.test(inlineError)) {
      throw new LoginStepError("submit-failed", inlineError);
    }

    await delay(1_500);
  }

  return false;
}

async function establishEmployerSession(
  page: Page,
  preferredUrl?: string,
): Promise<void> {
  const applicantsTarget = resolveEmployerApplicantsUrl(preferredUrl);
  if (preferredUrl?.trim() && isBrowseCatalogUrl(preferredUrl.trim())) {
    console.warn(
      `Ignoring browse-catalog applicants URL (${preferredUrl.trim()}); ` +
        `navigating to ${applicantsTarget} instead.`,
    );
  }

  const targets = [
    `${BASE_URL}/dashboard`,
    `${BASE_URL}/manage-job`,
    applicantsTarget,
    DEFAULT_APPLICANTS_URL,
  ].filter((url, index, list) => list.indexOf(url) === index);

  for (const target of targets) {
    await page
      .goto(target, { waitUntil: "domcontentloaded", timeout: 45_000 })
      .catch(() => undefined);
    await dismissOverlays(page);
    await delay(2_500);

    if (page.url().includes("/login")) {
      continue;
    }

    if (isBrowseCatalogUrl(page.url())) {
      continue;
    }

    if (await isEmployerLoggedIn(page)) {
      return;
    }
  }
}

async function waitForEmployerSession(page: Page): Promise<boolean> {
  for (let attempt = 0; attempt < 12; attempt++) {
    if (await isEmployerLoggedIn(page)) {
      return true;
    }
    await delay(1_500);
  }

  return false;
}
