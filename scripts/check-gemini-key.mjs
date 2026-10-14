#!/usr/bin/env node
// Live receipt-scanning key guard.
//
// WHY: the receipt pipeline (convex/receipts.ts parseReceipt) forwards
// process.env.GEMINI_API_KEY verbatim to
//   https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
// A wrong/expired/Convex-shaped key in the Convex backend env fails SILENTLY at
// scan time (Google returns 401/403, the action throws a generic error) — the
// unit tests stub fetch and never catch it. Real prod incident 2026-08-06:
// Convex held a Convex-credential-shaped value (AQ.Ab8RN6I...) instead of the
// Google key (AQ.Ab8RN6L...); receipt scans broke until the key was corrected.
//
// WHAT THIS DOES: reads the deployed GEMINI_API_KEY via `npx convex env get`
// and makes ONE real POST to the exact endpoint the code uses (a tiny 1x1 PNG
// prompt). If Google does not return 200, the build/CI fails — so a bad deploy
// key can never ship again without a signal. It never prints the key.
//
// SCOPE: only enforced when a Convex deploy key is present (CI / prod deploy).
// Local dev without CONVEX_DEPLOY_KEY is skipped — it cannot read prod env and
// the unit suite already covers the missing-key path.

import { spawnSync } from "node:child_process";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// 1x1 red PNG, base64 — smallest valid image so the probe is cheap.
const TINY_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function fail(msg) {
  console.error(`[check-gemini-key] FAIL: ${msg}`);
  process.exit(1);
}

const hasDeployKey = !!process.env.CONVEX_DEPLOY_KEY;
// CI may also pass NEXT_PUBLIC_CONVEX_URL (prod deployment) without a deploy key.
const hasConvexUrl = !!process.env.NEXT_PUBLIC_CONVEX_URL;

if (!hasDeployKey && !hasConvexUrl && process.env.CI !== "true") {
  console.log(
    "[check-gemini-key] Skipped (no CONVEX_DEPLOY_KEY / NEXT_PUBLIC_CONVEX_URL; local dev). " +
      "Unit tests cover the missing-key path.",
  );
  process.exit(0);
}

// 1. Resolve the deployed GEMINI_API_KEY from Convex env (key is never printed).
const envRes = spawnSync("npx", ["convex", "env", "get", "GEMINI_API_KEY"], {
  encoding: "utf8",
  // inherit nothing secret; keep the command self-contained
  env: process.env,
});
if (envRes.status !== 0) {
  fail(
    "`npx convex env get GEMINI_API_KEY` failed (exit " +
      `${envRes.status}). Ensure CONVEX_DEPLOY_KEY is set and the deployment is reachable.`,
  );
}
const apiKey = (envRes.stdout || "").trim();
if (!apiKey) {
  fail(
    "GEMINI_API_KEY is empty in the Convex backend environment. Set it with " +
      "`npx convex env set GEMINI_API_KEY <google-gemini-key>` (the same key TeacherBOY uses).",
  );
}

// 2. Make the real request the production code makes.
const url = `${GEMINI_ENDPOINT}?key=${apiKey}`;
const body = JSON.stringify({
  contents: [
    {
      role: "user",
      parts: [
        { text: "Reply with the single word: ok" },
        { inline_data: { mime_type: "image/png", data: TINY_PNG_B64 } },
      ],
    },
  ],
});

let status;
try {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  status = res.status;
} catch (err) {
  fail(`request to Gemini endpoint threw: ${err.message}`);
}

if (status !== 200) {
  fail(
    `Gemini endpoint returned HTTP ${status} for the deployed GEMINI_API_KEY. ` +
      "The receipt-scanning key is wrong/expired. Copy the working Google Gemini " +
      "developer key (e.g. from TeacherBOY/.env GEMINI_API_KEY) and run " +
      "`npx convex env set GEMINI_API_KEY <key>`.",
  );
}

console.log(
  "[check-gemini-key] OK: deployed GEMINI_API_KEY authenticates against " +
    "generativelanguage.googleapis.com (gemini-2.5-flash, HTTP 200).",
);
process.exit(0);
