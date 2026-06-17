# Helper Comparison

Manage and rank domestic helper applications from [HelperPlace](https://www.helperplace.com) for Singapore hiring.

## Features

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

### 2. Convex

```bash
npx convex dev
```

Copy the deployment URL into `.env.local`:

```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

Set `INGEST_SECRET` in Convex dashboard environment variables (Settings → Environment Variables) **and** in `.env.local`.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_CONVEX_URL` | Vercel + local |
| `INGEST_SECRET` | Vercel, Convex, GitHub Actions, local |
| `DASHBOARD_PASSWORD` | Vercel + local |
| `HELPERPLACE_EMAIL` | GitHub Actions secrets, scraper `.env` |
| `HELPERPLACE_PASSWORD` | GitHub Actions secrets, scraper `.env` |
| `HELPERPLACE_APPLICANTS_URL` | Your job applicants page URL (while logged in as employer) |
| `INGEST_URL` | GitHub Actions — your deployed `https://your-app.vercel.app/api/ingest` |

### 4. Run locally

```bash
npm run dev
```

Visit http://localhost:3000 and sign in with `DASHBOARD_PASSWORD`.

### 5. Run scraper manually

```bash
cd scraper
cp ../.env.example .env   # fill credentials
npm run scrape -- --dry-run   # saves JSON to scraper/output/
npm run scrape                # POSTs to ingest API
```

### 6. Deploy to Vercel

```bash
npx vercel
```

Add the same env vars in Vercel project settings.

### 7. Daily GitHub Actions cron

Add repository secrets: `HELPERPLACE_EMAIL`, `HELPERPLACE_PASSWORD`, `HELPERPLACE_APPLICANTS_URL`, `INGEST_URL`, `INGEST_SECRET`.

Workflow runs daily at 8am SGT (`.github/workflows/daily-scrape.yml`).

## Hard filters (defaults)

- Reference letter from past employer
- Can start by October 2026
- Finished contract or present in Singapore
- Speaks English

Adjust on the **Preferences** page.

## Project structure

```
app/           Next.js dashboard
convex/        Database, ranking, ingest API
scraper/       Playwright daily scraper
components/    UI components
```
