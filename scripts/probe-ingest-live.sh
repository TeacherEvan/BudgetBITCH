#!/usr/bin/env bash
# Probe the deployed /receipts/ingest with the exact bot payload shape and print
# only status codes + response bodies. The bearer token is never echoed.
set -euo pipefail
cd "$(dirname "$0")/.."

TOKEN="$(npx convex env get CONVEX_SYNC_SECRET 2>/dev/null | tr -d '\r\n')"
CLOUD_URL="$(grep -oE 'https://[a-z0-9-]+\.convex\.cloud' .env.local | head -1)"
SITE="${CLOUD_URL//.convex.cloud/.convex.site}"
URL="$SITE/receipts/ingest"

probe() {
  local label="$1" body="$2" auth="$3"
  local out
  out="$(curl -s -o /tmp/ingest_body.txt -w '%{http_code}' -X POST "$URL" \
    -H 'Content-Type: application/json' -H "Authorization: Bearer $auth" \
    --data "$body")"
  echo "[$label] HTTP $out"
  head -c 400 /tmp/ingest_body.txt; echo; echo "---"
}

# Exactly what receipt_bridge.gemini_text_to_ocr_payload emits: currencyHint null.
BOT_PAYLOAD='{"lineUserId":"Uprobe-unmapped-'"$(date +%s)"'","idempotencyKey":"probe_'"$(date +%s)"'","payload":{"lines":[{"text":"TOKO SEJAHTERA","conf":85.0,"y":0.0,"words":[]},{"text":"TOTAL DISC -60.000","conf":85.0,"y":100.0,"words":[]},{"text":"TOTAL 91000","conf":85.0,"y":200.0,"words":[]}],"width":1024,"height":400,"lang":"en","engine":"gemini-vision@1","capturedAt":'"$(date +%s000)"',"countryHint":"TH","currencyHint":null}}'

probe "bad-token" "$BOT_PAYLOAD" "definitely-not-the-secret"
probe "bot-shape-nullhint" "$BOT_PAYLOAD" "$TOKEN"
probe "empty-lines" '{"lineUserId":"Uprobe","idempotencyKey":"probe_bad","payload":{"lines":[]}}' "$TOKEN"

rm -f /tmp/ingest_body.txt
