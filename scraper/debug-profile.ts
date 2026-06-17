#!/usr/bin/env node
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, ".env") });

const URL =
  "https://www.helperplace.com/resume/singapore/domestic-helper/ike/404294";

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(3_000);

  const report = await page.evaluate(() => {
    const sectionHeaders = [...document.querySelectorAll("*")]
      .filter((el) => {
        const t = (el.textContent ?? "").trim();
        return (
          el.children.length <= 2 &&
          /^(Professional Info|Skills|About Me|Work Experience|Education|My Expectations)/i.test(
            t,
          )
        );
      })
      .slice(0, 20)
      .map((el) => ({
        tag: el.tagName,
        class: el.className?.toString().slice(0, 80),
        text: (el.textContent ?? "").trim().slice(0, 60),
      }));

    const badges = [...document.querySelectorAll("span, a, div, li")]
      .filter((el) => {
        const t = (el.textContent ?? "").trim();
        return t === "Baby Care" || t === "English" || t === "Housekeeping";
      })
      .slice(0, 10)
      .map((el) => ({
        tag: el.tagName,
        class: el.className?.toString().slice(0, 100),
        parentClass: el.parentElement?.className?.toString().slice(0, 80),
      }));

    const refText = [...document.querySelectorAll("*")]
      .filter((el) => /reference letter/i.test(el.textContent ?? ""))
      .slice(0, 5)
      .map((el) => ({
        tag: el.tagName,
        text: (el.textContent ?? "").trim().slice(0, 100),
      }));

    const workDates = [...document.querySelectorAll("*")]
      .filter((el) => /Jan 2023\s*-\s*Aug 2023|May 2024\s*-\s*Jun 2026/i.test(el.textContent ?? ""))
      .slice(0, 3)
      .map((el) => ({
        tag: el.tagName,
        class: el.className?.toString().slice(0, 80),
        text: (el.textContent ?? "").trim().slice(0, 200),
      }));

    return { sectionHeaders, badges, refText, workDates };
  });

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}

main().catch(console.error);
