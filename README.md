# Helper Comparison

Manage and rank domestic helper applications from [HelperPlace](https://www.helperplace.com) for Singapore hiring.

## Features

- **SSO sign-in** — Clerk authentication with per-user data isolation
- **HelperPlace credentials** — Encrypted storage in Settings (email, password, applicants URL)
- **Daily scrape** — Playwright logs into your HelperPlace employer account and pulls applicant profiles
- **Parse & filter** — Extracts skills, experience, reference letters, start dates; applies your hard filters
- **Rank** — Configurable scoring for baby care, child care, housework, cooking, and more
- **Dashboard** — Inbox, daily summary, excluded list, candidate detail, preferences
- **WhatsApp** — Click-to-chat links with message templates (you send manually)

## Setup

### 1. Install dependencies

```bash
npm install
cd scraper && npm install && cd ..
```

### 2. Clerk (SSO)

1. Create a free app at [clerk.com](https://clerk.com)
2. In Clerk Dashboard → **Configure** → enable the sign-in methods you want (Google, email, etc.)
3. Copy **API Keys** into `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. In Clerk Dashboard → **JWT Templates** → **New template** → choose **Convex**
5. Copy the template **Issuer** URL into:
   - `.env.local` as `CLERK_JWT_ISSUER_DOMAIN`
   - Convex Dashboard → Settings → Environment Variables as `CLERK_JWT_ISSUER_DOMAIN`
6. In Vercel project settings, add the same Clerk keys plus `CLERK_JWT_ISSUER_DOMAIN`

### 3. Convex

```bash
npx convex dev
```

Copy the deployment URL into `.env.local`:

```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

Set these in the **Convex dashboard** (Settings → Environment Variables):

| Variable | Purpose |
|----------|---------|
| `INGEST_SECRET` | Scraper → API authentication |
| `CLERK_JWT_ISSUER_DOMAIN` | Validate Clerk JWTs |
| `CREDENTIALS_ENCRYPTION_KEY` | AES-256-GCM for HelperPlace passwords (`openssl rand -hex 32`) |
| `SCRAPE_USER_ID` | (Optional) Default user for GitHub Actions scrapes |

### 4. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_CONVEX_URL` | Vercel + local |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel + local |
| `CLERK_SECRET_KEY` | Vercel + local |
| `CLERK_JWT_ISSUER_DOMAIN` | Vercel, Convex, local |
| `INGEST_SECRET` | Vercel, Convex, GitHub Actions, local |
| `CREDENTIALS_ENCRYPTION_KEY` | Vercel, Convex |
| `SCRAPE_USER_ID` | Vercel, Convex, GitHub Actions (after first sign-in) |
| `INGEST_URL` | GitHub Actions — `https://your-app.vercel.app/api/ingest` |

HelperPlace credentials are entered in the app under **HelperPlace** (Settings), not in env vars.

### 5. Run locally

```bash
npm run dev
```

Visit http://localhost:3000 — you will be redirected to `/sign-in`.

### 6. Save HelperPlace credentials

1. Sign in via Clerk
2. Open **HelperPlace** in the sidebar (`/settings`)
3. Enter your HelperPlace employer email, password, and applicants page URL
4. Copy your **Scraper user ID** and set it as `SCRAPE_USER_ID` in Convex and GitHub Actions

Passwords are encrypted with `CREDENTIALS_ENCRYPTION_KEY` before storage. They are never returned to the browser after save.

### 7. Run scraper manually

```bash
cd scraper
cp ../.env.example .env   # set INGEST_SECRET, INGEST_URL, SCRAPE_USER_ID
npm run scrape -- --dry-run   # saves JSON to scraper/output/
npm run scrape                # POSTs to ingest API
```

With `SCRAPE_USER_ID` set, the scraper loads credentials from the dashboard API. Without it, legacy `HELPERPLACE_EMAIL` / `HELPERPLACE_PASSWORD` env vars still work.

### 8. Deploy to Vercel

```bash
npx vercel
```

Add all env vars from step 4 in Vercel project settings, then redeploy.

### 9. Daily GitHub Actions cron (current)

Add repository secrets: `INGEST_URL`, `INGEST_SECRET`, `SCRAPE_USER_ID`.

Workflow runs daily at 8am SGT (`.github/workflows/daily-scrape.yml`). Credentials come from the Settings UI — you no longer need `HELPERPLACE_EMAIL` / `HELPERPLACE_PASSWORD` in GitHub secrets if `SCRAPE_USER_ID` is set.

## Phase 2 (planned)

- Per-user scheduled scraping via Convex cron (replaces GitHub Actions)
- **Scrape now** button in the dashboard
- Per-user ingest API keys

## Hard filters (defaults)

- Reference letter from past employer
- Can start by October 2026
- Finished contract or present in Singapore
- Speaks English

Adjust on the **Preferences** page.

## Project structure

```
app/           Next.js dashboard + API routes
convex/        Database, ranking, auth, encrypted credentials
scraper/       Playwright daily scraper
components/    UI components
```
