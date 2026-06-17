#!/usr/bin/env bash
# Sets GitHub Actions secrets for the daily scrape workflow.
# Run from repo root after: gh auth login, Vercel deployed, scraper/.env filled in.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v gh >/dev/null; then
  echo "Install GitHub CLI: https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Run: gh auth login"
  exit 1
fi

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
if [[ -z "$REPO" ]]; then
  echo "No GitHub remote. Create the repo first:"
  echo "  gh repo create helper-comparison --private --source=. --remote=origin --push"
  exit 1
fi

read_env() {
  local key="$1"
  local file="$2"
  if [[ -f "$file" ]]; then
    grep -E "^${key}=" "$file" | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//'
  fi
}

INGEST_SECRET="$(read_env INGEST_SECRET "$ROOT/scraper/.env")"
INGEST_SECRET="${INGEST_SECRET:-$(read_env INGEST_SECRET "$ROOT/.env.local")}"
EMAIL="$(read_env HELPERPLACE_EMAIL "$ROOT/scraper/.env")"
PASSWORD="$(read_env HELPERPLACE_PASSWORD "$ROOT/scraper/.env")"
APPLICANTS_URL="$(read_env HELPERPLACE_APPLICANTS_URL "$ROOT/scraper/.env")"

if [[ -z "$INGEST_URL" ]]; then
  echo "Set INGEST_URL to your production ingest endpoint, e.g.:"
  echo "  export INGEST_URL=https://your-app.vercel.app/api/ingest"
  exit 1
fi

for var in INGEST_SECRET EMAIL PASSWORD APPLICANTS_URL; do
  if [[ -z "${!var}" ]]; then
    echo "Missing $var — fill in scraper/.env first."
    exit 1
  fi
done

echo "Setting secrets on $REPO …"
gh secret set HELPERPLACE_EMAIL --body "$EMAIL"
gh secret set HELPERPLACE_PASSWORD --body "$PASSWORD"
gh secret set HELPERPLACE_APPLICANTS_URL --body "$APPLICANTS_URL"
gh secret set INGEST_SECRET --body "$INGEST_SECRET"
gh secret set INGEST_URL --body "$INGEST_URL"

echo "Done. Secrets configured for Daily HelperPlace Scrape."
echo "Test: gh workflow run daily-scrape.yml"
