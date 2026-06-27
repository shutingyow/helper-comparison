#!/usr/bin/env bash
# Run once after first app sign-in creates a Convex user row.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
DEPLOY="${CONVEX_DEPLOYMENT:-hearty-rook-105}"
OUT="$(CONVEX_DEPLOYMENT="$DEPLOY" npx convex data users --limit 5 2>&1)" || true
echo "$OUT"
if echo "$OUT" | grep -q "no documents"; then
  echo "No users yet — sign in to the app, then re-run this script."
  exit 1
fi
# Pipe/table format from `npx convex data` (quoted _id in first column)
USER_ID="$(echo "$OUT" | awk -F'|' '
  NR > 1 && NF > 0 {
    gsub(/^[ \t"]+|[ \t"]+$/, "", $1)
    if ($1 ~ /^j[a-z0-9]+$/) { print $1; exit }
  }
')"
# Fallback: any Convex id on a data row (skip header line with _id)
if [[ -z "$USER_ID" ]]; then
  USER_ID="$(echo "$OUT" | grep -v '^[[:space:]]*_id' | grep -oE 'j[a-z0-9]+' | head -1 || true)"
fi
if [[ -z "$USER_ID" ]]; then
  USER_ID="$(echo "$OUT" | awk '/^j[a-z0-9]+/ {print $1; exit}')"
fi
if [[ -z "$USER_ID" ]]; then
  echo "Could not parse user _id from convex data output."
  exit 1
fi
echo "Using user id: $USER_ID"
CONVEX_DEPLOYMENT="$DEPLOY" npx convex env set SCRAPE_USER_ID "$USER_ID"
if command -v vercel >/dev/null; then
  if ! vercel env ls production 2>/dev/null | grep -q SCRAPE_USER_ID; then
    printf '%s' "$USER_ID" | vercel env add SCRAPE_USER_ID production
  fi
fi
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  gh secret set SCRAPE_USER_ID -R shutingyow/helper-comparison --body "$USER_ID"
fi
echo "SCRAPE_USER_ID configured. Redeploy Vercel if production was missing the var."
