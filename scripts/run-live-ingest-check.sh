#!/usr/bin/env bash
# Opt-in live wire check for /receipts/ingest.
# Derives the .convex.site host (HTTP routes are NOT served from .convex.cloud)
# and pulls the bearer token from the Convex deployment env. The secret is never
# echoed: only its presence and length class are reported.
set -euo pipefail

cd "$(dirname "$0")/.."

CONVEX_SYNC_SECRET="$(npx convex env get CONVEX_SYNC_SECRET 2>/dev/null | tr -d '\r\n')"
export CONVEX_SYNC_SECRET

CLOUD_URL="$(grep -oE 'https://[a-z0-9-]+\.convex\.cloud' .env.local | head -1)"
BUDGETBOSS_CONVEX_SITE_URL="${CLOUD_URL//.convex.cloud/.convex.site}"
export BUDGETBOSS_CONVEX_SITE_URL

if [ -z "$CONVEX_SYNC_SECRET" ] || [ -z "$BUDGETBOSS_CONVEX_SITE_URL" ]; then
  echo "live check unavailable: token or site url missing" >&2
  exit 2
fi

echo "site=$BUDGETBOSS_CONVEX_SITE_URL token=present(${#CONVEX_SYNC_SECRET} chars)"
npx vitest run tests/integration/hf-bot-ingest-live.test.ts
