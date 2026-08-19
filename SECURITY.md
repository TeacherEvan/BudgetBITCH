# Security Policy — Budget Boss (`BudgetBITCH`)

This document describes the **actual** security architecture of Budget Boss.
It is advisory documentation only; it does not define a supported-version
matrix (the product is a single continuously-deployed web app, not a
versioned library).

## Authentication

- **Shipped path:** Convex Auth (`@convex-dev/auth`) with the Password provider
  (email + password). This is the only authentication mechanism in production.
- **Token storage:** session tokens are stored in `localStorage` (not cookies)
  so that in-app mobile webviews (LINE, WhatsApp) can read them — cookies are
  unavailable in those webview contexts.
- **Removed scaffold:** an unwired NextAuth (`next-auth`) Google scaffold
  (`src/auth.ts`, `src/app/api/auth/[...nextauth]`) was decommissioned. It was
  never part of the auth flow and is no longer present in the codebase.

## Authorization

- Every privileged Convex entry point derives identity from
  `ctx.auth.getUserIdentity()` (or `getAuthUserId`). No public Convex function
  accepts a `userId` argument from the client for authorization decisions.
- Internal server-resolved actions (`parseReceipt`, `parseLineReceipt`,
  `ingestReceipt`) resolve the user server-side via the LINE mapping or the
  authenticated session before any write.

## Local-first data & sync

- Local data is written to IndexedDB (`idb`) immediately for offline-first UX.
- Daily snapshots are synced to Convex async via `upsertDailySnapshot`; the
  `syncQueue` store replays on the `online` event. Rapid offline edits are
  compacted by calendar day before flush.

## Webhook / bot ingestion

- `ingestReceipt` (LINE / TeacherBOY HF Space) verifies the request signature
  with Web Crypto HMAC using a constant-time compare.
- Bearer-token verification for trusted callers also uses constant-time compare.
- No secret value is ever returned in a response body or logged.

## Secrets management

- No secrets are hardcoded in source. All credentials (Convex URL, VAPID keys,
  LINE channel secret, sync token) are read from `process.env` / Convex env vars.
- `BUDGETBOSS_SYNC_TOKEN` must equal the Convex `CONVEX_SYNC_SECRET`; verify with
  `npx convex env get` before deploy.

## Web push (VAPID)

- Push notifications use the Web Push standard with VAPID keys. Private VAPID
  keys live in Convex env, never in client bundles.

## Reporting a vulnerability

Email the maintainer or open a private security advisory on the GitHub
repository. Include a minimal reproduction and the affected surface (auth,
webhook, sync, or client). Expect an acknowledgement within a few business days.
