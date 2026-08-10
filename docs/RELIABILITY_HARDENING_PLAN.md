# Reliability Hardening Plan

Status: Draft
Author: Engineering (Hermes agent session, 2026-07-31)
Scope: Prevent recurrence of the two classes of bugs fixed this session —
(a) external-dependency breakage hidden by CSP drift, and
(b) concurrent-call re-entrancy in the offline sync path.

Related fixes already shipped:
- `vercel.json` CSP `connect-src` now whitelists `https://api.frankfurter.dev`
  (commit 039dcb6) — fixes the Currency Converter.
- `flushOfflineQueue` now has an `isFlushingQueue` single-flight guard
  (commit e281ed6) — fixes double-flush of `syncQueue`.

---

## Problem statement

1. **CSP ↔ source-host drift.** The Currency Converter calls
   `fetch('https://api.frankfurter.dev/v1/latest')`. The host was never in the
   `vercel.json` `connect-src` allowlist. The browser blocks the request under
   CSP; the card's `convert()` always hit its `catch` and showed
   "Could not fetch live rates." `curl` from the terminal succeeded (curl ignores
   CSP), so the failure was invisible until a browser ran it. No unit test
   exercised the fetch path, so CI stayed green while production was broken.

2. **Re-entrant flush.** `flushOfflineQueue()` is called from both the `online`
   event listener and `queueOfflineSnapshot()`. Two near-simultaneous triggers
   could both read the same `syncQueue` items before either deleted them,
   causing duplicate snapshot pushes to Convex.

3. **Comment rot.** `reset-completeness.test.ts` kept a "documents the bug"
   header describing a defect that had already been fixed
   (`handleResetConfirm` already calls `clearAllData()`). Misled the next
   debugging session into re-investigating a non-issue.

---

## Recommendations (priority-ordered)

### P1 — CSP / source-host drift guard (CI)

**Goal:** Fail the build when source code references a network host that the
CSP does not allow.

**Approach A — static allowlist sync check (fast, recommended first):**
- Add `scripts/check-csp-hosts.mjs`.
- Parse `vercel.json` → extract `connect-src` hosts (the tokens that are not
  `'self'`, `wss:`, or scheme keywords).
- Walk `src/**/*.{ts,tsx}` and collect literal URLs passed to `fetch(`,
  `new WebSocket(`, dynamic `import(`, and `XMLHttpRequest.open` calls.
- For each found host, assert it appears in the CSP allowlist. On miss, print
  `CSP missing host: <host> used in <file:line>` and exit non-zero.
- Wire into `package.json` as `npm run check:csp` and call it from `npm run ci`.

**Approach B — remove the surface entirely (robust, larger):**
- Proxy FX rates through a Convex HTTP action (`convex/fxRates.ts`) that fetches
  Frankfurter server-side and returns the rates. The browser then only calls
  `*.convex.cloud` (already allowlisted), so no client-side `connect-src` entry
  is needed. Caches server-side with a TTL to respect Frankfurter's free-tier
  rate limits. This also fixes offline/CORS concerns in one move.

**Decision:** Ship A immediately (low risk, catches the exact class). Track B as
a follow-up that removes the dependency on client egress entirely.

### P1 — Unit-test the Currency Converter

**Goal:** Lock the conversion math and the fetch contract so a regression or
CSP break surfaces in CI, not in production.

- Add `src/components/dashboard/currency-converter-card.test.tsx`.
- Mock global `fetch` (vi.fn) to return the Frankfurter shape
  `{ amount: 1, base: 'EUR', rates: { USD: 1.08, ... } }`.
- Assert:
  - 100 EUR → USD uses the fetched rate and renders a formatted currency string.
  - `from === to` short-circuits to rate 1 without a network call.
  - a failed fetch sets the "Could not fetch live rates" error state and nulls
    the result (current safe-fallback behaviour).
- Keep the module-level `ratesCache` reset between tests to avoid cross-test
  leakage.

### P2 — Audit sibling re-entrancy hazards

**Goal:** Find other places with the same "two callers, no single-flight" shape.

- Grep `src` for `addEventListener('online'` and every direct caller of
  `syncDailySnapshot`, `flushOfflineQueue`, `applyRemoteBoard`,
  `restoreFromCloudSnapshot`.
- For each, confirm it is not invoked concurrently from independent triggers
  (events, debounced timers, query re-fires). Apply the same
  `isXxxRunning` module-level boolean + `finally` reset pattern where a race
  exists.
- Pay special attention to `useAccountSync` pull/push effects (already guarded
  by `lastAppliedAt`/`applyingRemote`); confirm the guards cover the
  `budgetbitch:flushQueues` custom event path.

### P2 — Kill bug-characterization comment rot

**Goal:** A "documents the bug" header must never outlive the fix.

- Convention (add to AGENTS.md §8 pitfalls table): when a fix lands, the test's
  header comment flips from "characterizes bug" to "guards regression" and names
  the shipped fix + commit. If the handler is already correct, say so.
- Lint rule (optional, later): a script `scripts/check-stale-bug-comments.mjs`
  greps test files for the phrase "CURRENT (buggy)" / "documents the bug" and
  fails if found, forcing the comment to be updated at fix time.

### P3 — Converter graceful fallback

**Goal:** Degrade instead of going permanently dead when the network or CSP
drifts.

- Ship a small static fallback rate table (EUR-relative) for the
  `CURRENCY_SELECT_OPTIONS` set, dated, used only when fetch fails.
- On failure, render `Last known rate (offline)` instead of only an error, and
  still compute a conversion using the fallback so the card is never useless.
- Note fallback staleness in the existing "Live rates · updated …" line or a
  new "offline" affordance.

### P3 — Post-reset queue hygiene

**Goal:** Ensure a reset that wipes local data cannot be silently undone by a
stale queued snapshot.

- `RESET_PRESERVE` currently keeps `budgetbitch:offlineQueue` and
  `budgetbitch:boardQueue` (so an in-flight sync can finish). But a queued
  snapshot taken *before* reset could still `upsertDailySnapshot` old data to
  the cloud, and `AccountSyncMount` only blocks *restore*, not *push*.
- Fix: in `handleResetConfirm`, before `clearAllData()`, clear `syncQueue`,
  `budgetbitch:offlineQueue`, and `budgetbitch:boardQueue`, OR stamp those
  queued items with the reset timestamp and drop any item whose snapshot
  `createdAt` precedes `bb:lastResetAt`.
- Add a test: seed a pre-reset queued snapshot, run reset, assert no older
  snapshot is pushed and `syncQueue` is empty.

---

## Implementation order

| Step | Item | Effort | Blocker risk |
|------|------|--------|--------------|
| 1 | `scripts/check-csp-hosts.mjs` + `npm run check:csp` in CI | S | none |
| 2 | `currency-converter-card.test.tsx` | S | none |
| 3 | Re-entrancy audit (grep + patch siblings) | M | none |
| 4 | AGENTS.md comment-rot convention | S | none |
| 5 | Converter fallback rate table | M | none |
| 6 | Post-reset queue stamping + test | M | none |
| 7 | (Follow-up) Convex FX proxy (Approach B) | L | CSP check can be relaxed once live |

---

## Verification

Each item is done only when:
- `npm run lint -- --no-cache` clean
- `npm run typecheck` clean
- `npx vitest run` green (new tests included)
- `npm run build` green
- For CSP guard: a deliberately unwhitelisted `fetch('https://evil.test')`
  added to a scratch file makes `npm run check:csp` fail (negative test).

---

## Open questions for maintainer

- Prefer Approach A (allowlist sync) shipped now, or go straight to B (Convex
  FX proxy) which removes client egress? B is more robust but larger.
- Is `support@budgetboss.app` a real inbox, or should the error-boundary mailto
  point at an existing address? (Already changed in e281ed6; confirm deliverability.)
- Should the offline fallback rates live in a config file the non-dev can edit,
  or be hardcoded constants?
