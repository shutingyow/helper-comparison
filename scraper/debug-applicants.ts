#!/usr/bin/env node
import { config } from "dotenv";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { assertEmployerLoggedIn, login } from "./lib/auth.js";
import { DEFAULT_APPLICANTS_URL, resolveApplicantsPage } from "./lib/applicants.js";
import { delay } from "./lib/utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, ".env") });
config({ path: path.join(__dirname, "..", ".env") });

async function main(): Promise<void> {
  const email = process.env.HELPERPLACE_EMAIL;
  const password = process.env.HELPERPLACE_PASSWORD;
  if (!email || !password) {
    console.error("Missing credentials");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await login(page, email, password);
    await assertEmployerLoggedIn(page);
    const resolved = await resolveApplicantsPage(page, DEFAULT_APPLICANTS_URL);
    console.log(`Resolved applicants page: ${resolved}`);

    // Scroll to load lazy cards
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await delay(800);
    }

    const report = await page.evaluate(() => {
      const appliedCards = [...document.querySelectorAll("*")].filter((el) =>
        /Applied\s+\d+/i.test(el.textContent ?? ""),
      );

      const allResumeLinks = [...document.querySelectorAll('a[href*="/resume/"]')].map((a) => ({
        href: (a as HTMLAnchorElement).href,
        text: (a.textContent ?? "").trim().slice(0, 80),
        inNav: !!a.closest("nav, header, footer"),
      }));

      const singaporeResumeLinks = allResumeLinks.filter((l) =>
        /\/resume\/singapore\//i.test(l.href),
      );

      const strictPattern = /\/resume\/singapore\/[^/]+\/[^/]+\/\d+/i;
      const strictLinks = singaporeResumeLinks.filter((l) => strictPattern.test(l.href));

      const tabs = [...document.querySelectorAll("a, button, [role=tab]")]
        .map((el) => (el.textContent ?? "").trim())
        .filter((t) => /^(All|Recommended|Applicant|Shortlisted)/i.test(t));

      const pagination = [...document.querySelectorAll(".pagination a, [class*=pagination] a")]
        .map((a) => ({
          text: (a.textContent ?? "").trim(),
          href: (a as HTMLAnchorElement).href,
        }));

      const cardSamples = appliedCards.slice(0, 3).map((el) => {
        const card = el.closest("article, li, [class*=card], div") ?? el;
        const links = [...card.querySelectorAll("a[href]")].map((a) => ({
          href: (a as HTMLAnchorElement).href,
          text: (a.textContent ?? "").trim().slice(0, 60),
        }));
        return {
          snippet: (card.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 200),
          links,
        };
      });

      return {
        url: location.href,
        title: document.title,
        tabs: [...new Set(tabs)].slice(0, 10),
        appliedCardCount: appliedCards.length,
        allResumeLinkCount: allResumeLinks.length,
        singaporeResumeLinkCount: singaporeResumeLinks.length,
        strictResumeLinkCount: strictLinks.length,
        strictLinks: strictLinks.slice(0, 10),
        nonNavSingaporeLinks: singaporeResumeLinks.filter((l) => !l.inNav).slice(0, 15),
        pagination,
        cardSamples,
      };
    });

    const outPath = path.join(__dirname, "output", "debug-applicants.json");
    await writeFile(outPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    console.log(`\nWrote ${outPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
