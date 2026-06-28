#!/usr/bin/env bash
# Legacy helper — multi-tenant scraping no longer needs SCRAPE_USER_ID in GitHub/Vercel.
# Users enable daily scrape from Settings after saving HelperPlace credentials.
set -euo pipefail
echo "Multi-tenant scraping is enabled."
echo "Save HelperPlace credentials in Settings (/settings) — daily scrape runs at 8am SGT for all enabled users."
echo "GitHub Actions only needs INGEST_URL and INGEST_SECRET."
echo ""
echo "For local dev, optional: export SCRAPE_USER_ID=<user-id> or npm run scrape -- --all-users"
