# Reliability Hardening Plan — Resolution

**Status: COMPLETE (all 6 shipped items verified against live tree, 2026-09-15)**
**Original plan:** `docs/RELIABILITY_HARDENING_PLAN.md` (draft, 2026-07-31)

Archived after empirical verification per surgical-implementation dispatcher rule:
*code state decides, not the doc's status banner.* Re-implementing already-shipped
work fabricates diffs and wastes the gate run; this file records what was verified.

## Verification method

Fresh `npm install` (no node_modules in clone) + full local gate chain:

| Gate | Result |
|---|---|
| `npm run lint` (ESLint 9) | exit 0 |
| `npm run typecheck` (tsc --noEmit) | exit 0 |
| `npm test` (Vitest) | 682 passed / 0 failed, 121 files |
| `npm run test:convex` | 195 passed / 0 failed, 31 files |
| `npm run build` (Next.js 16 production) | exit 0 |
| `check:idb` (IDB schema guard) | OK, 9 stores |
| `check:csp` (CSP drift guard) | OK, 1 host |
| `check:comments` (stale bug-comment guard) | OK, 214 files |

## Per-item confirmation

| Step | Plan item | Live evidence |
|---|---|---|
| 1 | `scripts/check-csp-hosts.mjs` + `npm run check:csp` in CI | `scripts/check-csp-hosts.mjs` (8.5 KB); wired into `scripts/run-full-ci.mjs` step 4/12; `package.json` `check:csp` script. **Teeth proven:** injected `fetch('https://evil.test/api')` into a scratch file → guard exits 1 with `CSP missing host: evil.test`; removed → exits 0. |
| 2 | `currency-converter-card.test.tsx` | `src/components/dashboard/currency-converter-card.test.tsx` (4.2 KB, 17 `expect` assertions across 4 `it` blocks). Exercises live-rate conversion, identity short-circuit (no network call), fetch-reject fallback, and non-ok-response fallback. |
| 3 | Re-entrancy audit (single-flight guards) | `src/lib/convex/sync-snapshots.ts:321-384` — `isFlushingQueue`, `isSyncingDaily`, `isRestoringSnapshot` module-level booleans with `finally` reset. All callers enumerated: `online` event listener (L390), `pwa-register.tsx`, `sync-status-indicator.tsx` (custom `budgetbitch:flushQueues` event path — guarded), `reset-password-form.tsx`, `convex-password-auth-form.tsx`, `account-sync-mount.tsx`, `storage-diagnostics-modal.tsx`. |
| 4 | AGENTS.md comment-rot convention | `AGENTS.md` §8 pitfalls table + §8 comment-rot convention; `scripts/check-stale-bug-comments.mjs` wired as `check:comments` + CI step 11/12. **Teeth proven:** injected a `documents the bug` header → guard reports `2 stale bug comment(s) found`; removed → `✅ No stale bug comments`. |
| 5 | Converter fallback rate table | `src/components/dashboard/currency-options.ts` `FALLBACK_RATES` (16 currencies, EUR-relative, dated snapshot 2026-07-31). Card renders `Last known rate (offline)` + computes from fallback on fetch failure (`currency-converter-card.tsx:73-88`). |
| 6 | Post-reset queue stamping + test | `src/components/settings/data-backup-card.tsx` `clearSyncAndQueues()` (drains `syncQueue` IDB store + `receiptDrafts` + 3 localStorage queues); awaited in `handleResetConfirm` before `clearAllData()`. Tombstone `bb:lastResetAt` blocks restore direction. Test: `reset-queue-hygiene.test.ts` (5 `it` blocks: drains syncQueue, removes all 3 localStorage queues, preserves theme/locale keys, idempotent, safe when store absent). |

## Deferred (not blocking)

- **Step 7 — Convex FX proxy (Approach B):** explicitly deferred in the plan ("Track B as a follow-up"). No `convex/fxRates.ts` exists; client still calls `api.frankfurter.dev` directly, now covered by the CSP guard. The guard (step 1) is the shipped safety net; the proxy removes client egress entirely and can be picked up without re-opening the closed items.

## Open questions for maintainer (carried forward, unanswered)

- Prefer Approach A (allowlist sync) shipped now, or go straight to B (Convex FX proxy)?
- Is `support@budgetboss.app` a real inbox?
- Should offline fallback rates live in a config file the non-dev can edit, or be hardcoded constants?
