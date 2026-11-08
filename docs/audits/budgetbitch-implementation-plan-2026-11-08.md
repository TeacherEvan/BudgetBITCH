# Implementation Plan — Budget Boss / BudgetBITCH

**Audit date:** 2026-11-08 · **Scope:** `src/`, `convex/` (356 impl files, 37,622 eff. LOC; 165 test files) · **Stack:** Next.js 16, Convex, IndexedDB · **HEAD:** `ec80b3a2`

| Metric | Value |
| :--- | :--- |
| Pre/Post SHA-256 | `f65d7520…` / `f65d7520…` **VERIFIED ZERO MUTATION** |
| Health score | **79/100** (`D_raw=91`, `P_test≈6.3`, `M_kill≈58%`) |
| Risk | **MODERATE** (0 P0; P1=8, P2=7, P3=6) |

> Pass 2.5 live geometry probe: **N/A** — no layout/obstruction/overlap complaint to probe; canvas findings below are static (per-frame gradient analysis) and code-verified.
> `git status --porcelain` clean post-audit; telemetry used a patched copy in `/tmp/opencode` (prunes `node_modules`, `.next`, `dist`) so digests stay comparable. Scanner CC is a floor (`\b` misses `?`/`&&`/`||`) and `public/tesseract` inflates the raw top-15 — those 5 vendored files excluded from all rankings below.

### Hotspots (excl. vendored/i18n/test)

| File | LOC | CC/nest | Signature |
| :--- | :--- | :--- | :--- |
| `src/components/launch/golden-splash.tsx` | 612 | 25/7 | Per-frame `createRadialGradient` ×120 particles |
| `src/hooks/use-local-db.ts` | 622 | 15/5 | 8-hook god module, silent catches |
| `src/hooks/use-quick-add-state.ts` | 636 | 1/7 | Draft-clobber + double-save (CC floored, not 1) |
| `src/lib/db/local-db.ts` | 491 | 34/10 | Split data/timestamp transactions |
| `src/lib/convex/sync-snapshots.ts` | 414 | 29/8 | Sequential gathers, timestamp flattening |
| `convex/accounts/accountCrud.ts` | 408 | 1/8 | N+1 queries in `listMyAccounts` |
| `convex/line.ts` | 413 | 1/6 | Check-process-record idempotency race |

### Where earlier counts were wrong (corrected)

- `.collect()`: **zero in production** (tests only). `withIndex` 127 / `.take()` 43 — querying is disciplined.
- Public mutations correctly derive identity via `getAuthUserId`; `userId` args exist **only** in `internal*` fns — not a client-trust violation.
- One silent `catch {}` prod-site (`contextual-insight-pill.tsx:35`); 43/41 listener add/remove balance is healthy.
- Dead sweep: 61 "dead" value exports are ~80% false positives (filesystem routes, same-file helpers, static-only use). Only the `resolveShareCode`/board-reuse rows need proof before deletion — plan Phase 3 verifies each with grep, never bulk-deletes.

## P1 — Fix first (8)

1. **LINE webhook duplicates** — `convex/line.ts:370-457`: checks `isWebhookEventProcessed`, processes, then records; concurrent retries both ingest; one failed event blocks recording so retries re-ingest successes. Atomic `checkAndRecordWebhookEvent` exists but is never called.
2. **Ingest draft duplicates** — `convex/receipts/ingest.ts:143-200`: check-then-insert on `(userId, clientDraftId)`; concurrent POSTs double-insert.
3. **Snapshot date duplicates** — `convex/snapshots.ts:44-75`: `.first()` then patch/insert; parallel upserts create two rows for one day.
4. **Share-code uniqueness broken + split-brain profile** — `convex/sharedBoards.ts:24-47` vs `convex/accounts/helpers.ts:24-49` (two `ensureProfileDoc`, two code gens; `by_shareCode` not unique; collision retry dead since insert never throws) → `.unique()` crashes linking.
5. **Invite cap race + decline-after-accept** — `convex/accounts/accountInvites.ts:230-286`: concurrent accepts exceed `MAX_MEMBERS`; `declineInvite` has no status check.
6. **Purge timeout** — `convex/purge.ts:184-435`: whole wipe in one mutation; large accounts hit execution limits and half-delete.
7. **CSV import flips refunds** — `src/modules/budgeting/csv-import.ts:195-223`: `hadParens ? abs : abs` (dead branch) imports every negative as a positive expense.
8. **Quick-Add races** — `src/hooks/use-quick-add-state.ts:249-322`: bot-draft effect re-fills fields on every realtime tick (clobbers edits, no dirty guard); local-add then `confirmBotDraft` is non-atomic (confirm failure → duplicate on retry).
9. **Sync clock skew** — `src/lib/db/local-db.ts:349-352`, `src/lib/convex/sync-snapshots.ts:469-518`: data write and `localWrites` timestamp are separate transactions; restore flattens *all* timestamps to restore-time, so restored data always wins future merges.

## P2 — Structure/perf (7)

- **N+1 listing** — `accountCrud.ts:99-248`: per-account × per-member queries (~150 worst case).
- **Sequential gathers + `capBackup` re-stringify** — `sync-snapshots.ts:88-222`.
- **Silent, non-cancellable hooks** — `use-local-db.ts` (mounted-flag leak on event loads; errors swallowed → stale UI).
- **Unvalidated blobs** — `v.any()` board/snapshot payloads (`schema.ts`) + `parseCsv` char-concat on UI thread.
- **No-op partner push** — `pendingDeletes.ts:101-118` (`notifyPartner` voids all args; consent waits for manual open).
- **Multi-member consent mismatch** — any member may approve/reject any request (`pendingDeletes.ts:180-230`).
- **Crypto thin spot** — PBKDF2 100k iterations, empty password allowed (`crypto-backup.ts`); date fallback `toISOString()` UTC day-shift (`csv-import.ts:280-283`).

## Tests — why P1s survived (mutation truth)

Basis: 165 files, 4,228 assertion sites, 50 `toThrow` in 17 files, 62 files with negative signals, 48 `vi.mock` files. Sampled slice: `csv-import.test.ts` 53 expects/0 mocks/4 neg (strong pure-module coverage); `sync-snapshots.test.ts` 19 expects/4 mocks/0 neg (call-count trap + mock-mirror); `boardMerge.test.ts` 9 expects/0 neg (tie-break untested); `accounts.test.ts` 62 expects/21 neg (strongest).

| Module | Mutants M1-M4 killed | Missed |
| :--- | :--- | :--- |
| `csv-import.ts` | 3.5/4 | refund-sign, UTC date |
| `capBackup`/`flush` | 3/4 | — |
| `boardMerge.ts` | 2/4 | tie `>=`, Infinity `updatedAt` |
| `accountInvites.ts` | 1/4 | concurrent accept, decline-after-accept |

**`M_kill ≈ 58%.`** Every TOCTOU above lacks a *concurrent double-invoke* assertion — sequential happy-path tests can never kill that mutant class.

---

# Implementation Plan

Ground rules for every prompt below: scope to the listed files only; Conventional Commits; verify with `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:convex`, `npm run build` (or `npm run ci`); never change the Convex schema/indexes in this batch (no `CONVEX_DEPLOYMENT` here → `npx convex codegen` would fail — derive from existing fields instead).

## Phase 1 — Containment (P1 correctness, no structure changes)

**1a. Idempotency races (items 1–3).** One pattern, three sites: claim-first, then process.

- `line.ts`: call `checkAndRecordWebhookEvent` *before* processing (already written, dead); move the single record ahead of the per-event loop; make the record *per-message-id* so one failure can't re-ingest siblings.
- `ingest.ts` / `snapshots.ts`: use the existing `by_user_and_clientDraftId` / `by_user_and_date` indexes as the claim — attempt insert, on insert-conflict re-read and return the winner (insert-then-read, never read-then-insert).

> **Prompt [P1-1] (`convex/line.ts`, `convex/receipts/ingest.ts`, `convex/snapshots.ts`):**
> "Do not touch any other files. Convert the three check-then-act idempotency paths to claim-first (insert, on conflict re-read the winner; in `line.ts` call the existing `checkAndRecordWebhookEvent` before processing and record per message id). Add a regression test per file firing two concurrent duplicate calls and asserting exactly one draft/snapshot. Run `npm run test:convex` and confirm green."

**1b. CSV sign + date (item 7).** Preserve accounting sign: `(500)` and `-500` stay negatives (downstream sums already handle signed amounts; expense UI renders magnitudes); replace the `new Date(raw).toISOString()` fallback with local component read (`getFullYear/Month/Date`) to kill the UTC day-shift. Add tests: `parseImport` with `(50.00)` refunds, `normalizeDate('Jan 5 2026')` under `TZ=America/New_York`.

> **Prompt [P1-2] (`src/modules/budgeting/csv-import.ts` + its test):**
> "Fix `normalizeAmount` to keep negatives (`hadParens` branch currently returns `abs` twice) and fix the `normalizeDate` native fallback to format from local components instead of `toISOString()`. Add regression tests for a refund row and a date-only parse in a negative-offset timezone. Run `npm test` green."

**1c. Invite edge (item 5) + consent matrix (P2).** `declineInvite`: add `if (invite.status !== 'pending') throw`. `accept*`: re-check `members.length` inside the mutation transaction is already done — bound concurrent over-cap by treating the second inserter's duplicate row as the signal (patch-then-check `board.members` length after insert, roll back by deleting the just-inserted row if over cap). `pendingDeletes`: approver must be *the* other member (`otherMemberId`), not any member; requester-cancel stays allowed via `rejectItemDelete` only when `requestedBy === userId`.

> **Prompt [P1-3] (`convex/accounts/accountInvites.ts`, `convex/pendingDeletes.ts` + tests):**
> "Add the pending-status check to `declineInvite`; make approve require `otherMemberId(ref, userId)` and reject require requester-or-other-member; add tests for decline-after-accept (throws), third-member approve (throws), and concurrent accepts (exactly `MAX_MEMBERS` rows). Run `npm run test:convex` green."

## Phase 2 — Sync & list hardening (items 8–9 + N+1)

**2a. Dirty-guarded draft fill (item 8).** Add a `userEdited` ref set by `updateScannedLineItem`/manual inputs; bot-draft effect returns early once edited; remove `botDraftId` from effect deps (derive from `bot._id` directly). Confirm-first ordering: call `confirmBotDraft` *before* `addExpense`, with a local `confirmedDraftId` guard so a confirm failure blocks the local add instead of duplicating it.

> **Prompt [P1-4] (`src/hooks/use-quick-add-state.ts` + `quick-add/page.test.tsx`):**
> "Add a dirty guard so the bot-draft effect never overwrites user-edited scanned fields, drop `botDraftId` from the effect deps, and swap save ordering to confirm-then-local-add with a re-entry guard. Add tests: edit-then-realtime-update preserves edits; double-click Save writes once. Run `npm test` green."

**2b. Atomic timestamp writes (item 9).** Single cross-store transaction in `afterBoardMutation` paths (`expenses` + `localWrites` together — `recordLocalWritesBulk` already exists); on restore, preserve per-record `updatedAt` from the payload's board map when present instead of flattening to `now`, falling back to `max(now, payloadTs)`.

> **Prompt [P1-5] (`src/lib/db/local-db.ts`, `src/lib/db/stores/expenses-store.ts`, `src/lib/convex/sync-snapshots.ts` + tests):**
> "Write each board mutation and its `localWrites` stamp in one IndexedDB transaction (extend `recordLocalWritesBulk` to accept the data-store put), and stop flattening restore timestamps — use stored `updatedAt` when available. Add tests asserting one transaction per mutation (counting-stub on `idb.transaction`) and restore preserves a newer remote timestamp. Run `npm test` green."

**2c. List fan-out (P2).** In `listMyAccounts`, resolve display names with one `userProfiles` query per *unique* member (`Promise.all` over the deduped set — cache already exists, hoist it before the account map), and skip the per-account `accounts` fetch when `ownedIds` maps 1:1 to board rows. Same `getBoardMemberIds` + dedupe for the joined branch.

> **Prompt [P2-1] (`convex/accounts/accountCrud.ts` + `accounts.test.ts`):**
> "Hoist the display-name cache lookup so each unique member costs one `userProfiles` query total, and skip redundant per-account fetches. Add a query-count assertion test (≤ `accounts + members + 2` queries). Run `npm run test:convex` green."

**2d. Purge scheduler (item 6).** Keep the batched helpers; wrap the mutation in a scheduler chain: each chunk deletes ≤500 rows then `ctx.scheduler.runAfter(0, internal.purge.purgeChunk, {cursor})` until empty; profile delete stays last. This also fixes `deleteAllUserSnapshots` (same shape, `snapshots.ts:142-206`).

> **Prompt [P1-6] (`convex/purge.ts`, `convex/snapshots.ts`, `convex/crons.ts` + tests):**
> "Convert the two full-wipe mutations into scheduler-driven chunked purges (≤500 rows per run, profile last), each chunk returning the next cursor or done. Add tests with >500 synthetic rows asserting completion across chunks. Run `npm run test:convex` green."

## Phase 3 — De-vibing & debt (share-code, blobs, God hooks)

**3a. One profile factory (P1 item 4 + split-brain).** Single `ensureProfileDoc` in `convex/accounts/helpers.ts` (accounts shape wins); `sharedBoards.ts` imports it. Make `resolveShareCode`/`inviteByCode` resilient to duplicates already in the wild: `.unique()` → `take(2)` and fail closed with "code ambiguous, contact support" instead of throwing `Server Error`.

> **Prompt [P1-7] (`convex/sharedBoards.ts`, `convex/accounts/helpers.ts`, `convex/accounts/accountInvites.ts` + tests):**
> "Delete the duplicate `ensureProfileDoc`/`generateShareCode` in `sharedBoards.ts` and import the helpers version; make share-code lookups tolerant of duplicates (take 2, fail closed). Add tests for duplicate-code safety. Run `npm run test:convex` green."

**3b. Blob validation (P2).** `pushBoard`/`pushAccountBoard`: validate `incoming` keys against `store:itemId` pattern + `updatedAt` finite non-negative before merge (reject unknown prefixes); `mergeRecords`: reject `Infinity`/`NaN` timestamps (they poison forever and never evict).

> **Prompt [P2-2] (`convex/boardMerge.ts`, `convex/sharedBoards.ts`, `convex/accounts/accountBoardSync.ts` + tests):**
> "Add key-shape and finite-timestamp validation to both push mutations and the merge function; add tests for Infinity/NaN/garbage-key rejection. Run `npm run test:convex` green."

**3c. `use-local-db` error state (P2).** Replace the mounted-flag with a shared `useEffect` + `AbortController`-free revision counter (ignore stale responses by comparing a request seq), and surface `{error}` on failure instead of `loading:false` on stale data. No hook signature changes.

> **Prompt [P2-3] (`src/hooks/use-local-db.ts` + its tests):**
> "Surface load errors (`error` field) and drop stale responses with a request-sequence guard in every hook; keep all signatures identical. Add tests: failed load exposes error; slow first load can't overwrite a fresher event load. Run `npm test` green."

**3d. Crypto + smalls (P3).** PBKDF2 600k iterations (keep decrypt backward-compatible by trying stored iteration count field, default 100k for old backups); reject empty passwords at the `encryptBackup` boundary; `crypto-backup` salt-length check on decrypt. `priority-guide` + `dashboard-shell` due-day wrap: clamp `dueDay` via `Math.min(dueDay, daysInMonth)`.

> **Prompt [P3-1] (`src/lib/db/crypto-backup.ts`, `src/components/dashboard/priority-guide.tsx`, `src/components/dashboard/dashboard-shell.tsx` + tests):**
> "Raise PBKDF2 to 600k with backward-compatible decrypt, reject empty passwords/short salts, and clamp bill due-days to month length. Add tests for old-backup decrypt and Feb-31 due day. Run `npm test` green."

**3e. Dead-code verification pass (P2).** For each of the ~15 genuinely unreferenced sweep candidates (e.g. `EXCEL_TABS`, `createPanelConfigs`, `buildExcelPanels`, unused `Card*` sub-exports, `usePriorityAlerts` export veneer): grep `tests/ src/ e2e/` first — a test-only reference means *wire or delete*, never keep. Delete only after the grep proof is pasted in the PR.

> **Prompt [P2-4] (sweep candidates only):**
> "For each candidate: paste the `grep -rn` proof; delete only zero-external-reference symbols (excluding filesystem routes) and re-run the full `npm run ci` gate. Non-route deletes only."

## Acceptance gates (every phase)

- Failing-first: new assertion must be run against *pre-fix* code and shown red before the fix lands (mechanical revert-and-run, not "in my head").
- Count proofs where atomicity matters (`txCount === 1`, duplicate-row count `=== 0`, query-count bound).
- Each phase lands as its own green commit series (fix before its test), separately revertable; report persisted as its own docs commit.
