#!/usr/bin/env node
import { config } from "dotenv";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { assertEmployerLoggedIn, login } from "./lib/auth.js";
import { parseProfilePage } from "./parsers/profile.js";

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

  const headless = process.env.HELPERPLACE_HEADLESS !== "false";
  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();

  try {
    await login(page, email, password);
    await assertEmployerLoggedIn(page);
    const candidate = await parseProfilePage(page, PROFILE_URL);
    const json = JSON.stringify(candidate, null, 2);
    const outPath = path.join(__dirname, "output", "sample-candidate.json");
    await writeFile(outPath, json);
    console.log(json);
    console.error(`\nWrote ${outPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
