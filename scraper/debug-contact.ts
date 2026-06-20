#!/usr/bin/env node
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { assertEmployerLoggedIn, login } from "./lib/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, ".env") });

const PROFILE_URL =
  process.argv[2] ??
  "https://www.helperplace.com/resume/singapore/domestic-helper/ike/404294";

async function main(): Promise<void> {
  const email = process.env.HELPERPLACE_EMAIL;
  const password = process.env.HELPERPLACE_PASSWORD;
  if (!email || !password) {
    console.error("Missing HELPERPLACE_EMAIL or HELPERPLACE_PASSWORD");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await login(page, email, password);
    await assertEmployerLoggedIn(page);
    await page.goto(PROFILE_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(2_000);

    for (const selector of [
      'a.allow-btn:has-text("Accept all cookies")',
      'button:has-text("Accept all cookies")',
      'button:has-text("Accept")',
    ]) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await btn.click({ force: true });
        await page.waitForTimeout(500);
        break;
      }
    }

    const contactButtons = await page.evaluate(() => {
      const matches = [...document.querySelectorAll("a, button, [role='button']")]
        .filter((el) => /contact|call|whatsapp|phone/i.test(el.textContent ?? ""))
        .slice(0, 30)
        .map((el) => ({
          tag: el.tagName,
          text: (el.textContent ?? "").trim().slice(0, 80),
          href: el instanceof HTMLAnchorElement ? el.href : null,
          class: el.className?.toString().slice(0, 100),
          visible: (el as HTMLElement).offsetParent !== null,
        }));
      return matches;
    });
    console.log("Before click:", JSON.stringify(contactButtons, null, 2));

    const contactSelectors = [
      "button.contact",
      "button.hp-apply-btn.contact",
      ".btn.hp-apply-btn.contact",
    ];
    let contactBtn = page.locator("button.contact").first();
    for (const selector of contactSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
        contactBtn = el;
        console.log("Using contact selector:", selector);
        break;
      }
    }
    const hasContact = await contactBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log("Contact button visible:", hasContact);

    if (hasContact) {
      await contactBtn.click({ force: true });
      await page.waitForTimeout(1_500);

      const afterClick = await page.evaluate(() => {
        const telLinks = [...document.querySelectorAll('a[href^="tel:"]')].map((el) => ({
          href: (el as HTMLAnchorElement).href,
          text: (el.textContent ?? "").trim(),
        }));
        const waLinks = [...document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]')].map(
          (el) => ({
            href: (el as HTMLAnchorElement).href,
            text: (el.textContent ?? "").trim(),
          }),
        );
        const dialogText = [...document.querySelectorAll("mat-dialog-container, .modal, [role='dialog']")]
          .map((el) => (el.textContent ?? "").trim().slice(0, 500));
        const actionButtons = [...document.querySelectorAll("a, button, [role='button']")]
          .filter((el) => /call|whatsapp|phone/i.test(el.textContent ?? ""))
          .slice(0, 20)
          .map((el) => ({
            tag: el.tagName,
            text: (el.textContent ?? "").trim().slice(0, 80),
            href: el instanceof HTMLAnchorElement ? el.href : null,
          }));
        return { telLinks, waLinks, dialogText, actionButtons };
      });
      console.log("After Contact click:", JSON.stringify(afterClick, null, 2));

      const dialogItems = await page.evaluate(() => {
        const dialogs = [...document.querySelectorAll("mat-dialog-container, [role='dialog']")];
        const contactDialog = dialogs.find((d) =>
          /call\/whatsapp|send message|start chat/i.test(d.textContent ?? ""),
        );
        const dialog = contactDialog ?? dialogs[dialogs.length - 1];
        if (!dialog) return [];
        return [...dialog.querySelectorAll("a, button, [role='tab'], label, span, div")]
          .filter((el) => {
            const t = (el.textContent ?? "").trim();
            return t.length > 0 && t.length < 100;
          })
          .slice(0, 60)
          .map((el) => ({
            tag: el.tagName,
            text: (el.textContent ?? "").trim().slice(0, 80),
            class: el.className?.toString().slice(0, 80),
            href: el instanceof HTMLAnchorElement ? el.href : null,
          }));
      });
      console.log("Dialog items:", JSON.stringify(dialogItems, null, 2));

      const callWaSelectors = [
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

      let clicked = false;
      for (const selector of callWaSelectors) {
        const opt = page.locator(selector).first();
        if (await opt.isVisible({ timeout: 500 }).catch(() => false)) {
          console.log(`Clicking ${selector}...`);
          await opt.click({ force: true });
          await page.waitForTimeout(1_500);
          clicked = true;
          break;
        }
      }

      if (!clicked) {
        for (const label of ["Call/Whatsapp", "Call/ WhatsApp", "Call", "WhatsApp", "Phone"]) {
          const opt = page
            .locator("a, button, [role='button'], mat-list-item, .mat-menu-item")
            .filter({ hasText: new RegExp(label.replace("/", "\\/"), "i") })
            .first();
          if (await opt.isVisible({ timeout: 500 }).catch(() => false)) {
            console.log(`Clicking label ${label}...`);
            await opt.click({ force: true });
            await page.waitForTimeout(1_500);
            clicked = true;
            break;
          }
        }
      }

      if (clicked) {
        const revealed = await page.evaluate(() => {
          const telLinks = [...document.querySelectorAll('a[href^="tel:"]')].map((el) => ({
            href: (el as HTMLAnchorElement).href,
            text: (el.textContent ?? "").trim(),
          }));
          const waLinks = [...document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]')].map(
            (el) => ({
              href: (el as HTMLAnchorElement).href,
              text: (el.textContent ?? "").trim(),
            }),
          );
          const bodySnippet = (document.body.innerText ?? "").match(
            /(\+?65[\s-]?(?:\d[\s-]?){8}|\b[89]\d{3}[\s-]?\d{4}\b)/,
          );
          const dialogs = [...document.querySelectorAll("mat-dialog-container, [role='dialog']")].map(
            (el) => (el.textContent ?? "").trim().slice(0, 500),
          );
          const allLinks = [...document.querySelectorAll("a[href]")]
            .filter((el) => /tel:|wa\.me|whatsapp|phone/i.test((el as HTMLAnchorElement).href))
            .map((el) => ({
              href: (el as HTMLAnchorElement).href,
              text: (el.textContent ?? "").trim().slice(0, 80),
            }));
          return { telLinks, waLinks, allLinks, bodySnippet: bodySnippet?.[0], dialogs };
        });
        console.log("After Call/WhatsApp click:", JSON.stringify(revealed, null, 2));
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
