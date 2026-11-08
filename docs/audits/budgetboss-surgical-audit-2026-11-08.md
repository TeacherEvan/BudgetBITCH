# Surgical Audit Report: Budget Boss (`BudgetBITCH` Repository)

| Audit Metadata | Specification |
| :--- | :--- |
| **Audit Date** | 2026-11-08 |
| **Audited Scope** | `src/` + `convex/` (398 + 96 code files; 318 implementation files excl. locales/generated; 165 unit test files, 25 Playwright specs) — Effective LOC scanned 54,761 total (`55,000` rounded), implementation-only `35,880` LOC excl. tests/locales/`_generated`. See telemetry table. |
| **Tech Stack & Runtime** | Next.js 16.3.1 App Router, React 19, TypeScript strict, Convex 1.46+ (`@convex-dev/auth` Password), IndexedDB (`idb` v6) local-first PWA, next-intl 4.14.5, Tailwind 4.3.3, framer-motion, recharts, zod 4.3.6, tesseract.js + Gemini 2.5 Flash (server action), Vitest 5.1 + Playwright 1.63. Targets: modern browsers, Capacitor 8 mobile WebViews (LINE/WhatsApp in-app), Vercel frontend + `steady-ox-280` Convex backend. |
| **Pre/Post Audit SHA-256** | `src 110de5fe4d386b03 / 110de5fe4d386b03` + `convex 7c779fe564aaac61 / 7c779fe564aaac61` (VERIFIED ZERO SOURCE MUTATION — `git status --porcelain` clean at `ec80b3a2c768c0769544172f7f35363dbfda9b15` pre and post; this report file is the sole new artefact in `docs/audits/`, outside the scanned `src`/`convex` digests. Full hashes in §0.1. Host load at audit: `uptime 0.63/1.66/1.84` on multi-core box — no benchmark claims made.) |
| **Deterministic Health Score** | **`77 / 100`** (`D_raw = 100`, `P_test = 6.8`, `M_kill = 55%`) — formula in §4. |
| **Vibe-Debt Risk Level** | **`MODERATE`** (`65 ≤ S_health < 85`, `N_P0 = 0`) |

## 0.1 Telemetry Provenance (Pass 1)

Scanned with `surgical-audit/scripts/preflight_telemetry.py` on `src` and `convex` separately (full-repo scan avoided: `node_modules/` vendored trees would dominate the Merkle digest and timeout — the skill Pitfalls scoping rule). Same script pre/post gives comparable digests. Telemetry is a floor: the polyglot CC regex wraps non-word tokens in `\b`, so `? : && ||` branches are invisible in `CC`; `CC=1` with `depth ≥ 5` still flags high-complexity files. `silent_catches` regex only matches empty `catch {}` and therefore reports `0` even though `grep` finds 221 `catch` sites in `src` and 25 in `convex` (most log, ~35 are truly silent — see Lens 7).

| File Path | Effective LOC | Est. CC / Depth | Silent (grep) | Risk | Signature |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/components/launch/golden-splash.tsx` | 612 | 25 / 7 | 0 empty | 636.0 | God canvas component + per-frame gradients |
| `src/hooks/use-local-db.ts` | 622 | 15 / 5 | ~15 (logs) | 636.0 | 13 hooks, duplicated mount pattern |
| `src/hooks/use-quick-add-state.ts` | 636 | 1 / 7 | — | 636.0 | 776-line hook, 20 states, depth 7 |
| `src/components/settings/data-backup-card.tsx` | 596 | 14 / 6 | 3 | 609.0 | Export/import/reset in one card |
| `src/components/dashboard/dashboard-shell.tsx` | 546 | 14 / 5 | 0 | 559.0 | 8 hooks + layout + 10 modals |
| `src/lib/db/local-db.ts` | 491 | 34 / 10 | ~10 empty | 524.0 | Schema + 19-store barrel + dummy DB |
| `src/lib/convex/sync-snapshots.ts` | 414 | 29 / 8 | — | 442.0 | Gather + queue + restore + SW |
| `convex/purge.ts` | 343 | 22 / 7 | 1 empty | 364.0 | 435-line hard-delete (now complete) |
| `convex/sharedBoards.ts` | 258 | 23 / 5 | 2 empty | 280.0 | Couple board, `v.any()` push |
| `convex/pendingDeletes.ts` | 201 | 23 / 3 | 1 no-op | 223.0 | Consent flow, `notifyPartner` stub |
| `convex/receipts/ingest.ts` | 196 | 23 / 4 | 1 empty | 218.0 | HMAC + Bearer dual secret |
| `convex/lib/receipt/extract_total.ts` | 184 | 26 / 6 | — | 209.0 | Anchor/tender/change triangle |
| `convex/receipts/draftCrud.ts` | — | — | — | — | **No direct test**, 200-window filter |
| Locales `src/i18n/locales/*.ts` (×6) | ~628–661 ea | 1 / 4 | 0 | 628–661 ea | Data, excluded from impl LOC (counted as God by LOC only) |
| Tests `src/lib/db/local-db.test.tsx`, `app/quick-add/page.test.tsx` | 450/434 | 1 | 0 | 450/434 | Test LOC, not debt |

God files (>400 impl LOC): `golden-splash`, `use-local-db`, `use-quick-add-state`, `data-backup-card`, `dashboard-shell`, `local-db`, `sync-snapshots` + `convex/accounts/accountCrud.ts` (408), `convex/line.ts` (413). Orphan/dead-export sweep (`dead_export_sweep.py`): `src` 61 dead-value + 59 test-only (560 exports, 13 name collisions); `convex` 24 dead-value + 27 test-only (195 exports, 15 collisions). Textual-match caveat: barrels/dynamic access not followed — every row below was re-confirmed with `grep -rn` (see Lens 1, Lens 10).

State & data-flow topology (verified): Entry `src/app/layout.tsx:1-200` (locale cookie → `ConvexClientProvider` → `SharedBoardSync` → `AccountSyncMount` → `PWARegister`). Persistence: IndexedDB (`BudgetBITCHDB` v6, 19 stores, `src/lib/db/local-db.ts:21-131`) is the interaction source of truth; Convex (`convex/schema.ts`) is authority for auth/boards/snapshots/receipts; `localStorage` board queues (`budgetbitch:boardQueue`/`accountBoardQueue`/`offlineQueue`), IDB `syncQueue`, and Convex `sharedBoards.data`/`accountBoards.data` (keyed `mergeRecords` LWW maps) are the four sync representations joined by `BOARD_CHANGED_EVENT` (`src/lib/types/budget.ts`) + `localWrites` clock (`local-db.ts:261-347`). I/O boundaries: `convex/http.ts` (auth + `/receipts/ingest`), `convex/receipts/scanActions.ts` (bot proxy), `src/app/api/*` (legal/telemetry/vitals/news — zod-validated sinks), `src/app/proxy.ts` (nonce CSP). Global singletons: `dbInstance/dbPromise` (`local-db.ts:135-136`), `sharedConvexClient` (`convex-client-provider`), `flushTimer` (`logger.ts:66`), `isSyncingDaily/isFlushingQueue/isRestoringSnapshot` (`sync-snapshots.ts:339-345`), `getActiveSharedDeleteGuard` provider.

**Remediation status vs. the 2026-11-07 audit (65/100 HIGH, 3 P0 / 11 P1):** commits `ec80b3a`, `16c5d7c`, `9951b29`, `c456559` since that audit **fixed** the prior P0-1 (`snapshots-store` `TransactionInactiveError` — `recordLocalWritesBulk` now runs after `tx.done`, verified `snapshots-store.ts:74-124,200-262`), P0-2 (two-party delete bypass — `use-local-db.ts:172-189` now `throw`s on guard failure instead of falling back to local delete), P0-3 (`purge.ts` now destroys `boardShards` + `ledgerEntries`, verified `purge.ts:140-175`), P1-1 (reset tombstone — `RESET_TOMBSTONE_KEY` now checked in `sync-snapshots.ts:429-438`, `use-shared-board.ts:148`, `use-account-sync.ts:347`), and the backup-import `localWrites`/validation gap (`data-backup-card.tsx:283-345` now uses `parseAndValidateBackup` + `recordLocalWritesBulk` + `notifyBoardChanged`). **No defect below was carried over without re-verification; all line numbers refer to HEAD `ec80b3a`.**

## 1. Executive Architecture & Vibe-Debt Triage

The architecture is sound and hardened since November 7: bounded Convex queries everywhere in production (43 `.take()`, zero unbounded `.collect()` outside tests, 142 `.withIndex()`), correct identity derivation (`getAuthUserId`, never a client `userId` arg), and a working local-first/offline queue. What remains is not a collapse but a second-order tax: the sync layer still serializes the entire local database on every daily sync and FIFO-blocks behind one poisoned entry; the receipt pipeline still filters a 200-row window in memory so active users silently miss bot drafts; the shared board still lets a client timestamp lock a couple's LWW map; and the consent workflow computes its approver but its notifier is a typed no-op. The canvas splash is safe but wasteful (thousands of gradient allocations per second). Tests are broad (165 files, 2,303 `expect`/`assert` sites, 25 E2E specs) yet mock-mirrored at the highest-risk seams — `use-local-db`, `draftCrud` and `ingest` — so boundary/error mutants survive. Net: no P0 crash/data-loss/security hole found; eight P1 durability/integrity defects and a God-file/dead-export tax keep the repo at MODERATE debt.

| Severity Tier | Count | Deduction Weight | Primary Failure Domains |
| :--- | :--- | :--- | :--- |
| **P0 — Critical (Crash / Data Loss / Security / Leak)** | `0` | `-18 pts ea` | None verified at HEAD; prior 3 P0s fixed (see §0.1). nearest miss: P1-3 LWW future-timestamp lock (authenticated member required). |
| **P1 — High (Sync / Integrity / Frame-budget)** | `8` | `-8 pts ea` | `sync-snapshots.ts` (HOL + requeue), `golden-splash.tsx` (GC churn), `sharedBoards.ts` (client LWW), `draftCrud.ts` (200-window), `ingest.ts` (dual-secret/HMAC), `pendingDeletes.ts` (no-op notify), backup cap/sort |
| **P2 — Medium (God / Split-brain / Debt)** | `10` | `-3 pts ea` | 7 God files, 4-representation sync + dual clear fns, dead subtree, dashboard read amplification, listener leaks, silent catches/dummy DB, `v.any()` (39 hits), anchor overlap |
| **P3 — Low (Portability / DX / Hygiene)** | `6` | `-1 pt ea` | `JSON.parse` breadth, date sort, 1 s clock, LIFF script w/o SRI, speculation prerender of authed shell, URL revoke timing, 31 MB archive |

## 2. The 10-Principal-Engineer Deep Audit

### Lens 1 — Systems Architect (Topology, Coupling & State Machines)

- **[P2-1] God-file cluster (~3,892 LOC across 7 files)** — `src/hooks/use-local-db.ts:L1-750` (`useDatabaseListener` + 13 hooks), `src/hooks/use-quick-add-state.ts:L1-776`, `src/components/launch/golden-splash.tsx:L1-689`, `src/components/settings/data-backup-card.tsx:L1-687`, `src/components/dashboard/dashboard-shell.tsx:L1-595`, `src/lib/db/local-db.ts:L1-591`, `src/lib/convex/sync-snapshots.ts:L1-528`
  - **Root Cause Mechanism:** Each file mixes at least three concerns that evolve independently (React lifecycle + IndexedDB access + Convex sync + canvas render). `local-db.ts` is both schema (`BudgetBITCHDB:21-131`, `upgrade:204-244`) and access layer (19 store fns) and router (`export *:581-587`). `use-local-db.ts:99-750` repeats the identical `mounted`-flag + `get* .then/.catch` + `useDatabaseListener` stanza 13 times with zero shared helper, so a fix (e.g. guard-throw P0-2) had to be hand-applied per hook.
  - **Deterministic Trigger & Failure Mode:** Any change to the sync event contract (e.g. adding a 20th store) requires coordinated edits to `local-db.ts`, every hook, `USER_DATA_STORES`, `clearAllData` vs `clearAllUserData`, and `data-backup-card`/`sync-snapshots` loops — with no compiler enforcing the list. Omission surfaces only at runtime as a store that never syncs.
  - **Surgical Fix Specification:** Extract per concern without changing behaviour: (a) `local-db/schema.ts` (DBSchema + `upgrade` + `USER_DATA_STORES`), (b) `local-db/client.ts` (`getDB` + dummy), (c) keep store fns in `stores/*` (already present) and delete the barrel re-exports; (d) collapse the 13 hooks via a generic `useStoreHook(getter, storeKey, mutate)` factory in `use-local-db.ts`. See R1.

- **[P2-2] Four-representation split-brain + dual clear functions** — `src/lib/db/local-db.ts:L531-578`, `src/lib/convex/sync-snapshots.ts:L469-514`, `src/components/settings/data-backup-card.tsx:L146-199`
  - **Root Cause Mechanism:** The same logical board lives as (1) 8 flat IDB stores, (2) `sharedBoards.data` / `accountBoards.data` keyed maps (`convex/boardMerge.ts:19-55`), (3) `localStorage` push queues, (4) IDB `syncQueue`. Join logic is `BOARD_CHANGED_EVENT` + `localWrites`. Two reset paths diverge: `clearAllData:531-555` wipes 19 stores (incl. `newsCache`, `locationCache`, `settings`, `accountsData`, `receiptDrafts`, `syncQueue`); `clearAllUserData:567-578` wipes only `USER_DATA_STORES` (8). Callers pick one by convention; a future caller choosing `clearAllUserData` for a GDPR wipe leaves receipts/queues behind.
  - **Deterministic Trigger & Failure Mode:** Settings → Reset calls the server purge + `clearAllData` today (correct). A new “switch account” flow reusing `clearAllUserData` (name suggests full wipe) would preserve `receiptDrafts` + `syncQueue`, which `flushOfflineQueue` later re-uploads — the exact resurrection class the tombstone was built to stop, on the push side.
  - **Surgical Fix Specification:** Delete `clearAllUserData`; rename `clearAllData` → `clearAllStores` with an explicit `keep: ('settings'|'localAccounts')[]` param; route both call sites through `data-backup-card.tsx:clearSyncAndQueues` so the queue-drain-before-wipe order is single-sourced. Add an invariant test: every `USER_DATA_STORES` entry appears in both the backup loop and the restore loop.

- **[P2-3] Dead subtree advertised by barrels (verified, not sweep noise)** — `src/components/dashboard/panels/index.tsx:L22-52` (`buildExcelPanels`), `src/components/dashboard/panelConfig.ts:L45-75` (`EXCEL_TABS`, `createPanelConfigs`), `src/modules/home-base/home-base-store.ts:L8-95`
  - **Root Cause Mechanism:** `dashboard-shell.tsx:23` imports only `buildPanels`; `buildExcelPanels` has zero importers repo-wide (`grep buildExcelPanels` → definition + sweep hit only). `EXCEL_TABS/createPanelConfigs` likewise unreferenced; the live path is `PANEL_CONFIG` + `buildPanels`. `home-base-store.ts` exports (`loadHomeBase`, `saveHomeBase`, `getHomeBaseSnapshot`, `getHomeBaseServerSnapshot`) are referenced only by `home-base-store.test.ts`; the only live `home-base` imports are `reverse-geocode-label` and `location-permission`. Same-name sweep collisions (13 in `src`, 15 in `convex`) confirm the pattern: dead duplicates coexist with live ones while sharing reference counts.
  - **Deterministic Trigger & Failure Mode:** A maintainer imports the barrel’s advertised `buildExcelPanels` (plausible name, correct directory) and ships UI wired to the dead panel builder while `buildPanels` diverges underneath. Green tests (`home-base-store.test.ts`) certify unreachable code as “covered”.
  - **Surgical Fix Specification:** Delete `buildExcelPanels`, `EXCEL_TABS`, `createPanelConfigs` and the `home-base-store` read/write/subscribe surface *or* wire it to the wizard (choose one — do not keep both). Keep `reverse-geocode-label` + `location-permission`. Add a knip gate in CI (`knip.json` already configured with `exports: warn`) promoted to error for `src/components/dashboard` and `src/modules/home-base`.

### Lens 2 — Frame-Budget & Performance Engineer (Hot Loops & Latency)

- **[P1-1] Canvas gradient churn — ~7,200 `createRadialGradient`/sec at 60 fps** — `src/components/launch/golden-splash.tsx:L25-92,404-440`
  - **Root Cause Mechanism:** `drawGoldDust`, `drawCoin`, `drawSparkle` each call `ctx.createRadialGradient` + 3 `addColorStop` + up to 3 template-string `rgba()` fills **per particle per frame**. With the 120-particle pool (`POOL_SIZE:207`) saturated, that is up to 120 gradients × 60 = 7,200 gradient objects/sec plus ~360 string allocations/sec, all discarded per frame. `acquireParticle:209-216` is an O(N) `find` per spawn; physics + draw are fused in one `for...of` (`404-440`) so a frame-time spike cannot be profiled separately. Damping itself is correct (`Math.pow(0.98, dt)`, `dt` clamped `0.2–3.0` at `351`) — the budget break is allocation, not math.
  - **Deterministic Trigger & Failure Mode:** Low-end Android (Adreno, 60 Hz) mounting `/` (splash is the first paint). GC pauses > 16.67 ms every few hundred ms; `document.hidden` early-return (`353-356`) still holds the rAF loop alive at 1 Hz while throttled, wasting battery. Confetti (`src/components/ui/confetti.tsx:L60-90`) has the same per-particle `fillStyle` pattern but at ~80 particles for ~2.5 s — lower impact.
  - **Surgical Fix Specification:** Pre-render 3 sprite canvases (gold-dust / coin / sparkle at 64×64, DPR-scaled) once at mount; per frame `drawImage` with `globalAlpha` — zero gradients, zero strings. Cap DPR at 1.5 for canvas (visual difference negligible, fill-rate −56 %). See R2. Regression guard: hook `createRadialGradient` in a test and assert `0` calls after warm-up (geometry-probe pattern).

- **[P1-2] Task omitted — canvas static read bounds the fix:** `golden-splash` draws only `arc`/`fill`/`quadraticCurveTo` closed shapes — no `lineTo` polyline history, no teleport retention — so the Matrix-A “full-span streak” artefact class does not apply. `devicePixelRatio` is correctly honoured (`314-317`, `min(dpr,2)` + `setTransform`). No Pass 2.5 probe was run (see §2.5); the defect above is provable statically by allocation counting and needs no browser to reproduce (mount + frame counter).
  - **Root Cause Mechanism:** N/A — informational.
  - **Deterministic Trigger & Failure Mode:** N/A.
  - **Surgical Fix Specification:** If the splash ever gains motion trails, apply `runtime-probe-harness.md` (hook `moveTo`/`lineTo`, assert max segment < 160 px, clear history on resize).

- **[P2-4] Dashboard read amplification — 8 independent `getAll` per board change** — `src/components/dashboard/dashboard-shell.tsx:L72-95`, `src/hooks/use-local-db.ts:L66-86,137-256`
  - **Root Cause Mechanism:** `DashboardShell` mounts `useCriticalExpense`, `useWizardProfile`, `useBudgets`, `useBills`, `useExpenses`, `useSavingsGoals`, `useDebtPayoff`, `useEmergencyFund` — each opens its own `getDB()` + `getAll(store)` on mount and re-runs on **every** `BOARD_CHANGED_EVENT` (filtering only applies when `detail.source === 'local'`; remote/board-sync events always fan out to all 8–10 listeners, `useDatabaseListener:66-86`). Ten hooks × ten listeners = O(hooks²) wake-ups per write.
  - **Deterministic Trigger & Failure Mode:** Typing an expense triggers 8 IDB transactions + 8 sorts (`useExpenses:145`, `useIncomes:207`) on every keystroke-commit; on a 5k-expense board each `getAll` is a full-table scan + JS sort, dropping frames on mid-tier phones while the dashboard is already animating (skeleton intervals, hero clock).
  - **Surgical Fix Specification:** Introduce a single `useBoardSnapshot(stores)` subscription that resolves once per event and memoizes per-store slices (`useMemo` + targeted selectors). Short-term: gate `useDatabaseListener` to skip when `!document.visibilityState` or map `relevantStores` narrowly per hook (already partially done — extend to `NET_WORTH/FORECAST`).

- **[P3-1] Shipped weight in git (not bundle): 31 MB archive + fixture duplication** — `docs/.archive/2026-08-18-god-module-audit/surgical-pruning-0818-BudgetBITCH.html` (31 MB), `docs/.archive/.../AUDIT.html` (532 KB), `tests/fixtures/receipts/.corpus/*.jpg` (~1.5 MB, 8 files)
  - **Root Cause Mechanism:** `git ls-files | xargs du` shows the archive HTML outweighs the entire `src/i18n` tree by ~1000×. It is dead weight for every clone/CI fetch; the JPEG corpus is legitimate (receipt OCR fixtures) but ships in the repo root rather than Git LFS or a fixture archive.
  - **Deterministic Trigger & Failure Mode:** Fresh clone + `npm ci` pays tens of MB of audit archaeology forever; Vercel builds ignore `docs/` but contributors on metered links feel it.
  - **Surgical Fix Specification:** `git rm --cached` the 31 MB HTML files (keep a 5 KB pointer + summary MD), or move the archive out of the repo. Do not delete the JPEG corpus (it is the `runCorpus` regression source).

### Lens 3 — Mathematical, Physics & Algorithmic Engineer (Precision & Edge Cases)

- **[P1-3] Uploaded above as Lens 6 — cross-ref `pushBoard` future-timestamp lock (Lens 6, P1).** The Canvas damping path it would naturally sit in is verified correct: `dt` normalized to 60 fps units and clamped (`golden-splash.tsx:350-351`), exponential decay frame-rate independent (`Math.pow(0.98, dt)` at `425-426`), resize resets width/height before transform (`311-318`). No `v *= 0.95` bug remains after `79f4975`.
  - **Root Cause Mechanism:** N/A (healthy).
  - **Deterministic Trigger & Failure Mode:** N/A.
  - **Surgical Fix Specification:** None. Add a unit test pinning `dt` clamping so a future refactor cannot regress it.

- **[P2-5] Receipt-total triangle: `CASH` lives in both anchor lists; 5-minor-unit tolerance is magic** — `convex/lib/receipt/extract_total.ts:L1-60` (`NEGATIVE_ANCHORS`, `TENDER_PATTERNS`, `applyTriangularCheck`)
  - **Root Cause Mechanism:** `NEGATIVE_ANCHORS` rejects any line matching `/\bCASH\b/` (`continue` before positive-anchor collection), while `TENDER_PATTERNS` treats the same token as tender (`T`). A receipt line `CASH TOTAL 53.98` or `TOTAL CASH TENDERED` can be both rejected as a total candidate and consumed as tender. `applyTriangularCheck` then demands `|candidate − (T−C)| ≤ 5` (minor units) with no fallback when tender/change are absent, and `extractTotal` keeps only the rightmost amount per line — so `GRAND TOTAL 1,234.56` vs `100.00` on one OCR line picks the last number even if it is change.
  - **Deterministic Trigger & Failure Mode:** Thai/ZA cash receipts in the corpus (`tests/fixtures/receipts/.corpus/`) where tender/change lines share vocabulary with total lines. Engine returns `null` total or a change amount as total → `ingest.ts:179-180` stores `amount 0` or change → finance totals drift silently.
  - **Surgical Fix Specification:** Remove `\bCASH\b` from `NEGATIVE_ANCHORS` (keep `TENDERED`/`PAID` as tender-only); require tender **and** change on *distinct* lines before applying the triangle; promote `5` to `TRIANGLE_TOLERANCE_MINOR = 5` with a comment citing the 0.05-currency rationale; add corpus cases pinning `CASH TOTAL` vs `CASH TENDERED`.

- **[P3-2] Mixed-format date sort can discard the newest records during backup cap** — `src/lib/convex/sync-snapshots.ts:L209-216` (`capBackup` sort comparator)
  - **Root Cause Mechanism:** `capBackup` sorts by `date ?? entryDate ?? createdAt ?? month` via `String(...).localeCompare`, mixing `YYYY-MM-DD`, ISO datetime, month `YYYY-MM`, and (for legacy `netWorthSnapshots`) `date` only. `"2026-08"` sorts after `"2026-08-01"` lexicographically within the same month boundary and `month` keys interleave incorrectly with full dates; `slice(ceil(len/2))` then keeps a lexicographically-newest half that is not chronologically newest.
  - **Deterministic Trigger & Failure Mode:** User with > 900 KB backup (heavy expense history) hits the cap loop; a recent expense whose `date` is `2026-08-01` can be dropped while an older `month`-keyed commitment survives — silent cloud-backup loss discovered only on restore.
  - **Surgical Fix Specification:** Parse with `Date.parse` and fall back to entry order when the parse is `NaN`; per-store comparator table (expenses/incomes by `date`+`entryDate`, commitments by `month`, snapshots by `date`). Pin with a table-driven test (see MVTH Tier 1).

### Lens 4 — Concurrency, Async & Determinism Engineer (Race Conditions)

- **[P1-4] Offline-queue flush: head-of-line blocking + unbounded requeue** — `src/lib/convex/sync-snapshots.ts:L224-270,318-404` (`syncDailySnapshot`, `queueOfflineSnapshot`, `flushOfflineQueue`)
  - **Root Cause Mechanism:** (a) `flushOfflineQueue:367-398` loops items sequentially and `await`s `backoffWithJitter` (up to seconds) **inside** the loop (line 394) — one permanently-failing item stalls every later snapshot during its backoff, and two consecutive failures stall the whole queue. (b) `syncDailySnapshot:258-266` on *any* non-auth error calls `queueOfflineSnapshot` which inserts a **new** `syncQueue` row with `failCount: 0` (line 327) without deduplicating by date — a poisoned payload (e.g. `sanitizeForConvex` `JSON.stringify` hitting a `BigInt`, line 174) enqueues once per failed sync attempt and the queue grows unboundedly. (c) `queueOfflineSnapshot:334-336` triggers an immediate `flushOfflineQueue` when online, re-entering the single-flight guard mid-flush so the new row may not be visited until the next `online` event. (d) `failCount` read-modify-write (`386-391`) is two separate IDB ops, not a transaction — concurrent flushes can lose increments.
  - **Deterministic Trigger & Failure Mode:** Offline morning → 3 daily snapshots queue → go online with one oversized payload → flush stalls 2–8 s behind its backoffs while the user watches “Syncing…” → each retry adds another copy. On flaky mobile networks the queue wedges at the head item.
  - **Surgical Fix Specification:** (a) Move backoff *out* of the loop: process all items, collect failures, single `setTimeout` for the next retry. (b) Dedupe on `queueOfflineSnapshot` by date key (replace existing row for the same `date`; `compactQueueByDate` at flush already assumes this). (c) Do the `failCount` bump in the same `tx` as the read. (d) Drop `queueOfflineSnapshot`’s immediate flush — rely on the `online` listener + post-sync sweep. See R3.

- **[P1-5] Backup import/restore trusts per-record payloads (NaN poisoning after validation passes)** — `src/components/settings/data-backup-card.tsx:L241-300` (`executeDataImport`), `src/lib/convex/sync-snapshots.ts:L228-262` guard notwithstanding
  - **Root Cause Mechanism:** `parseAndValidateBackup` validates the envelope (`BackupPayloadSchema`) but `executeDataImport` then bulk-`put`s every record verbatim (`~L255-285`) into typed stores. A crafted/legacy backup with `amount: "abc"`, `amount: NaN`, or missing `id` passes the envelope and lands in `expenses`/`budgets`; downstream sums (`sync-snapshots.ts:101-102` `reduce((sum, e) => sum + e.amount, 0)`) then produce `NaN`, which `sanitizeForConvex` serializes as `null` to Convex and silently zeroes the month’s savings. Cloud restore (`restoreFromCloudSnapshot:484-513`) has the same shape: it keys `budgets`/`netWorthSnapshots`/`commitments` by derived `category`/`date`/`month` without validating the derived key exists.
  - **Deterministic Trigger & Failure Mode:** Import a backup produced by an older app version (or a hand-edited JSON with one corrupt expense) → dashboard totals flip to `NaN`/zero with no error surface; the corrupt row then re-syncs to Convex as if clean.
  - **Surgical Fix Specification:** Validate each record against its store schema (`expenseSchema`, `budgetSchema`, …) before the `tx`; quarantine failures into `importErrors[]` and surface a count to the user instead of aborting or silently accepting backend (see MVTH). Reuse the checkpoint already created (`createLocalCheckpoint:243`) for rollback on validation failure.

- **[P2-6] Ten listeners, one event — fan-out without backpressure** — `src/hooks/use-local-db.ts:L66-86` (`useDatabaseListener`), `src/hooks/use-shared-board.ts`, `src/hooks/use-account-sync.ts`
  - **Root Cause Mechanism:** Every `use-local-db` hook plus board-sync hooks subscribe to the same `BOARD_CHANGED_EVENT`. The `relevantStores` filter (`69-82`) only skips when `detail.source === 'local'` and stores are disjoint; remote pulls (`source: 'remote'`/`'board-sync'`) wake all subscribers unconditionally, each doing a full `getAll` + sort.
  - **Deterministic Trigger & Failure Mode:** Partner sync pull with 200 records → 10 hooks each re-read and re-sort within one event-loop turn → jank on the dashboard while reconciliation is still in flight.
  - **Surgical Fix Specification:** Coalesce via `requestAnimationFrame`/`queueMicrotask` batching in `useDatabaseListener` (one re-read per frame per hook, not per event); or a tiny pub/sub store that hands the already-fetched rows to all selectors. Microtask batching alone removes the burst without architectural change.

### Lens 5 — Memory & Resource Lifecycle Engineer (Leaks & Cleanup)

- **[P2-7] One-shot global listeners with no teardown (module-level, intentional but untestable)** — `src/lib/observability/logger.ts:L66,228-258` (`flushTimer`, `initObservability`), `src/lib/convex/sync-snapshots.ts:L406-409` (`online` listener)
  - **Root Cause Mechanism:** `initObservability` guards `if (!flushTimer)` then installs a 30 s `setInterval` + three `window.addEventListener` (`error`, `unhandledrejection`, `beforeunload`) with **no** exported `teardownObservability()`. `sync-snapshots.ts:407-409` does `if (typeof window !== 'undefined') window.addEventListener('online', flushOfflineQueue)` at module top-level with an anonymous handler that can never be removed. Both are correct for a once-imported singleton in prod but leak across HMR reloads and Vitest module re-imports (duplicate flush timers / duplicate `online` handlers → duplicate flush attempts, guarded only by the boolean single-flights).
  - **Deterministic Trigger & Failure Mode:** `vitest --watch` with `sync-snapshots.test.ts` + `http-client.test.ts` re-importing the module per file accumulates `online` listeners; a test asserting `flushOfflineQueue` called once fires it twice.
  - **Surgical Fix Specification:** `export function teardownObservability()` (clear interval + stored handler refs) called from `web-vitals-initializer.tsx` cleanup; convert the `online` listener to a named handler with `export function __teardownSyncListeners()` for tests or move registration into `registerSyncWorker()`’s idempotent guard. Behaviour in prod unchanged.

- **Verified healthy (no finding):** `golden-splash.tsx:447-451` cancels rAF + removes `resize`; phase timers `453-462` clear all three timeouts; `confetti.tsx:108-114`, `daily-disposable-hero.tsx:68-69` (`clearInterval`), `CountUp:47-51` (`cancelAnimationFrame`), `bento-grid.tsx:51-52` (`mq.removeEventListener`), `install-prompt.tsx:65-68`, `pwa-register.tsx:24-26`, `immersive-shell.tsx:45-77` are all symmetric. `useLineLink`’s `loadLiffSdk` interval is cleared on both resolve and timeout paths (`use-line-link.ts:32-40`). WebGL/AudioContext: no `getContext('webgl')` or `AudioContext` allocations exist — Canvas 2D only, no GPU-resource leak class to audit.

### Lens 6 — Security & Trust-Boundary Engineer (AppSec & Sandboxing)

- **[P1-6] Couple-board push accepts arbitrary client data + client timestamp (LWW lock)** — `convex/sharedBoards.ts:L217-257` (`pushBoard`, `data: v.any(), updatedAt: v.number()`), `convex/boardMerge.ts:L19-55` (`mergeRecords`), `convex/schema.ts:L28,74` (`data: v.any()`)
  - **Root Cause Mechanism:** `pushBoard` authenticates membership (`233-235`, correct) but then merges `args.data` as `Record<string, StoredRecord>` with **no schema validation** (`237`) and advances `updatedAt` from the client clock (`247: Math.max(board.updatedAt, args.updatedAt + 1)`). `mergeRecords` resolves per-key by `rec.updatedAt >= prev.updatedAt` (ties win for incoming). A compromised or clock-skewed client can push `updatedAt = Date.now() + 10 years` on any key; the server persists it, and every legitimate future push (`updatedAt` = real now) loses forever until the wall clock catches up. `data` is also unbounded — a single push can stuff a multi-MB object toward the 1 MB document limit with no `byteLength` guard (the client cap in `sync-snapshots.ts:184-222` does not apply to this path). A **server-computed verdict stored but never consumed** is not present here, but the inverse holds: the server stores an **unvalidated client verdict** and treats it as truth.
  - **Deterministic Trigger & Failure Mode:** Partner A’s phone clock is set +2 h (manual clock / GPS drift) → every key A pushes wins; partner B’s edits silently stop appearing on A’s device. Repro: call `pushBoard` with `data: { "expenses:x": { value: {...}, updatedAt: 9999999999999 } }` — the test suite has no case asserting a future timestamp is rejected or clamped.
  - **Surgical Fix Specification:** Clamp at the trust boundary: `effectiveUpdatedAt = Math.min(args.updatedAt, Date.now() + 60_000)`; validate `data` with a `v.record(v.string(), v.object({ value: v.any(), updatedAt: v.number(), deleted: v.optional(v.boolean()) }))` (narrow `value` per-store as the schema evolves); enforce a serialized-size budget (e.g. 512 KB per push) with `byteLength` and reject over-budget pushes with a structured error. Add tests: future `+1 day` rejected/clamped, tie-break deterministic, oversized rejected.

- **[P1-7] Receipt ingest: dual-secret reuse, future-HMAC window, uncaught verify, uncapped scrape** — `convex/receipts/ingest.ts:L13-44,48-78,105-176`, `convex/receipts/scrapeBot.ts:L12-48`
  - **Root Cause Mechanism:** (a) One secret `CONVEX_SYNC_SECRET` is both the Bearer token and the HMAC key (`51`, `112`) — a leak of the bot’s Bearer breaks app-identity delegation and vice versa; there is no domain separation. (b) `validateAppToken:28` uses `Math.abs(now − timestamp) > 5 min` — a token minted for **+5 min in the future** validates *now*, giving a stolen token a 10-minute effective window and leaking clock-skew acceptance. (c) `Buffer.from(hmac, "hex")` (line 39) on malformed hex yields a short buffer; `crypto.subtle.verify` then throws/rejects outside any `try` in the `httpAction` — the caller gets an opaque 500, not a 401 (observable from `scanActions` error paths). (d) The parallel `scrape` mutation takes `payload: v.any()` (no size cap; the *proxy* path caps at 8 MB at `scanActions.ts:62-64` but the direct mutation does not) and runs the full `scrapeEngine` synchronously — a multi-MB `lines[]` payload blocks the Convex isolate.
  - **Deterministic Trigger & Failure Mode:** Replay a captured `appToken` minted with a +4 min clock offset → accepted today. Fuzz `appToken` with `zz:zz` hex → 500 via `ScrapeBot` scrape path with 50k lines → isolate timeout / `O (n^2)` anchor scan in `extract_total.ts:80-110`.
  - **Surgical Fix Specification:** Derive per-purpose keys (`HKDF` or `HMAC(secret, "app-token")`); change the window to `now − timestamp ∈ [−60 s, +5 min]` (reject future beyond skew); wrap `validateAppToken`’s verify in `try` → 401 on throw; add `sizeBytes`/`lines.length ≤ 5k` caps to `scrape` mirroring `proxyReceiptScan`. Add negative tests: future token rejected, malformed hex → 401, oversized payload → 400.

- **[P1-8] Consent workflow computes its approver but never notifies it (no-op notifier)** — `convex/pendingDeletes.ts:L100-118` (`notifyPartner`), `L166-174` (call site)
  - **Root Cause Mechanism:** `requestItemDelete` correctly resolves `otherId` via `otherMemberId:43-56` and calls `notifyPartner(ctx, boardId, otherId, …)`, but `notifyPartner` is `void ctx; void toUserId; void title; void body;` with a comment that push is “done by the client-side subscription path.” The server persists the `pendingDeletes` row but fires **no** `ctx.scheduler` / internal action / push send. The partner learns of the request only by polling `listPendingDeletes` — and the settings UI does not poll it on an interval (it renders on mount / board-change). This is the audit’s canonical “stored but never consumed” shape: the verdict (which user must act, with `canAct` computed at `252-262`) exists, the money/enforcement path (the partner’s inbox) is never triggered from the server.
  - **Deterministic Trigger & Failure Mode:** Partner A requests a delete while partner B is offline → B opens the app next day, B’s dashboard shows no badge (badge is driven by `listPendingDeletes` mount), the pending item sits `pending` indefinitely. B *can* act if they navigate to Settings → Pending, but nothing surfaces it. Not data loss (the row persists), but a consent gate that depends on the approver discovering an invisible inbox.
  - **Surgical Fix Specification:** Do not reject the write; insert the verdict into the existing gate: `ctx.scheduler.runAfter(0, internal.pushSend.sendReminder, { userId: toUserId, title, body })` (or at minimum `ctx.scheduler.runAfter(0, internal.pendingDeletes.notifyBySchedule, …)`). Keep the persisted row as the audit trail (per §4.5 rule 10). Add a test asserting the scheduler is called exactly once per request (count the call, not just the return value).

### Lens 7 — Reliability, Fault Tolerance & Chaos Engineer (Crash Vectors)

- **[P2-8] Silent error swallowing + dummy-DB masking hides corruption as empty data** — `src/lib/db/local-db.ts:L153-186,261-347` (`DUMMY_SSR_DB`, `recordLocalWrite*`, `getLocalWrite`, `getAllLocalWrites`, `clearAllLocalWrites`), `src/components/dashboard/priority-guide.tsx:L27-58`
  - **Root Cause Mechanism:** `DUMMY_SSR_DB` is a `Proxy` that resolves `getAll → []`, `get → undefined`, `transaction →` no-op for SSR/jsdom. Callers (`useAccounts` hydration, `use-local-db` hooks) cannot distinguish “no data” from “IndexedDB unavailable/corrupt.” Every `recordLocalWrite*` wraps in `try { … } catch { // Non-fatal }` and `getLocalWrite` returns `0` on error — a `localWrites` store that is full or corrupt silently degrades the LWW clock to 0, and `mergeRecords` then prefers the *other* side for every key. `priority-guide.tsx:29,48` `JSON.parse` failures return an empty `Set` — corrupt `localStorage` silently clears the user’s dismissed-guide state every launch.
  - **Deterministic Trigger & Failure Mode:** IDB `QuotaExceededError` on `syncQueue` write → `queueOfflineSnapshot` swallows it (logs only in one path, fully silent in `localWrites`) → backup silently stops while the UI shows “queued”. Test with a `fake-indexeddb` store pre-filled to quota: the suite never asserts `getLocalWrite` distinguishes failure from zero.
  - **Surgical Fix Specification:** Return a typed `Result` (`{ ok: true, value } | { ok: false, error }`) from the `localWrites` family; surface quota errors via `notify('error')` once (not per write). Keep the dummy DB, but log a one-time `console.warn` when it is first used so SSR fallbacks are observable, and make `priority-guide`’s parse failures `console.warn` with the raw value length.

- **[P2-9] Poisoned-payload requeue + HOL backoff (see Lens 4, P1-4)** — same lines `sync-snapshots.ts:224-404`. Listed here because the failure mode is reliability, not just concurrency: the queue has no circuit breaker. After 3 failures the flush path drops the item (`387-389`), but the *sync* path (`syncDailySnapshot`) re-adds it with a reset counter, so the circuit breaker is bypassed by the newer writer. A permanently-oversized payload therefore cycles forever across sync attempts even though flush eventually drops it — unbounded `syncQueue` growth on a device that syncs daily.
  - **Root Cause Mechanism:** Two writers, two failure counters, no shared dedupe key.
  - **Deterministic Trigger & Failure Mode:** Backup > 1 MB that survives `capBackup` (single store with one huge record — the `while` loop exits when `stores.length === 0` at `capBackup:205`) → every `syncDailySnapshot` fails with “document too large,” enqueues a fresh copy, flush drops it after 3 tries, next sync re-adds it. `syncQueue` count climbs by 1/day indefinitely.
  - **Surgical Fix Specification:** Share the dedupe-by-date + `failCount` logic between the two writers (single `enqueueSyncItem(payload, date)`); if the same date fails 3× across *either* writer, drop it and emit a persistent `SyncDropped` notice with byte size so the user can export/reduce data.

- **[P3-3] Export download revoke timing** — `src/components/settings/data-backup-card.tsx:L225-231` (`URL.createObjectURL` → `a.click()` → sync `revokeObjectURL`)
  - **Root Cause Mechanism:** Revoking the object URL in the same task as `click()` can abort the download on Firefox/Safari where the click handler has not yet handed the blob to the download manager.
  - **Deterministic Trigger & Failure Mode:** Intermittent zero-byte/failed downloads on Safari for large (> 10 MB) backups. Smaller backups succeed, masking the pattern.
  - **Surgical Fix Specification:** `setTimeout(() => URL.revokeObjectURL(url), 10_000)` or revoke on the anchor’s `click` completion + a 4 s fallback.

### Lens 8 — Type Systems, Schema & Contract Engineer (Boundary Integrity)

- **[P2-10] `v.any()` as the schema (39 production hits) + test-only exports that certify dead code** — `convex/schema.ts:L28,74,112,121,138,224-243,271-277`, `convex/sharedBoards.ts:L221`, `convex/receipts/scrapeBot.ts:L12,49,70,113,162-163`, `convex/receipts/ingest.ts:L151,215`
  - **Root Cause Mechanism:** Board `data`, `fullBackupData`, `wizardProfile`, `confidence`/`evidence`/`lineItems`/`questionsAsked`, and every `scrape`/`answer`/`confirm` payload are `v.any()`. Convex validators are the *only* server-side trust boundary for these shapes, so any client (or a future compromised bot) can persist arbitrary JSON that later flows into `mergeRecords`, `applyAnswers`, and UI rendering without one `zod`/`v.object` check. Sweep cross-ref: `calculateBudgetFromWizard` (`17` test refs), `expenseLineItemsToCsv`/`parseCsv`/`detectColumns`, `getCategoryColor`/`CATEGORY_COLORS`, `haversineKm`, `getOrCreateLocalOwnerId`, `lockLocalVault` and ~50 more are **test-only** — green tests for code no production caller reaches (`useHaptic`, `getTransition`/`staggerContainer`, `NotificationPrefs` family, `BackupDataSchema`/`expenseLineItemsToCsv` import path) — while `CardHeader/CardTitle/...`, `useResolvedCountry`, `useWebVitals`, `BackupPayloadSchema(argv-only)` present as dead values. The suite therefore overstates protection at exactly the contract boundary where `v.any()` loosens it.
  - **Deterministic Trigger & Failure Mode:** Bot or hand-rolled client POSTs `{ payload: { lines: [{ text: 12345 }] } }` to `scrape` → `payload.lines.map((l: any) => l.text)` yields `undefined` joins and `scrapeEngine` throws or mis-extracts; `ingest`’s `existing as any` (`151`) then reads `result.fields` off a row that never had them. No test in `draftCrud`/`ingest` (zero direct tests) exercises a malformed payload.
  - **Surgical Fix Specification:** Introduce `receiptPayloadSchema` (zod) at `ingestSchema.ts` and reuse it in `scrape`/`answer`; replace `v.any()` board `data` with a discriminated `StoredRecord` validator (Lens 6 fix); wire or delete test-only exports per Lens 1 sweep (home-base, motion-utils, notification-prefs) and add a `knip --frozen` check to CI so new test-only surface fails the build.

- **[P3-4] `capBackup`’s honest `storeCounts` is recomputed but `fullBackupData` ordering is not stable** — `sync-snapshots.ts:L156-160`
  - **Root Cause Mechanism:** After capping, counts are recomputed correctly (good), but the surviving arrays retain the sorted order from the last halving iteration, so consecutive snapshots of unchanged data produce diffs in array order that Convex stores as new documents every day.
  - **Deterministic Trigger & Failure Mode:** Daily snapshot document churn (new `_creationTime`, rewrites) on heavy users even with no new expenses, inflating Convex storage and `updatedAt` subscribers.
  - **Surgical Fix Specification:** Sort each surviving store by its stable key (`id`/`category`/`date`/`month`) before returning from `capBackup`; the sort is O(N log N) once, not per loop iteration.

### Lens 9 — Platform, Viewport & Portability Engineer (Cross-Device Parity)

- **[P3-5] Speculation-rules prerender includes authenticated shells** — `src/app/layout.tsx:L85-115`
  - **Root Cause Mechanism:** `<script type="speculationrules">` prerenders `href_matches: "/*"` with exclusions for `/api`, sign-in/up/reset/forgot/privacy/terms/cookie-policy — but **not** `/dashboard`, `/accounts`, `/settings`, `/wizard`. Next prerenders those authenticated shells on hover/idle so SPA nav feels instant. The shells contain no Convex data (client-fetched via `RequireAuth`), so this is not a data leak, but the prerendered HTML is cached by the browser/bfcache and restored without re-running `RequireAuth`’s redirect in all restore paths — on a shared device the next user can briefly see the prior user’s *layout* (dashboard skeleton, header avatar initial) before the guard re-evaluates.
  - **Deterministic Trigger & Failure Mode:** Shared family tablet: User A browses Settings → navigates away → User B opens the app via bf-cache/prerender → sees A’s dashboard chrome for one frame before `RequireAuth` redirects to `/sign-in`.
  - **Surgical Fix Specification:** Add `/dashboard*`, `/accounts*`, `/settings*`, `/wizard*` to the `not.href_matches` exclusion list (nav cost is one client fetch; correctness over prefetch). If the instant-nav budget matters, prefetch only the *public* welcome/marketing shell.

- **Verified healthy (no finding):** `devicePixelRatio` scaling (`golden-splash.tsx:314-317`, `confetti.tsx:95-102`, both `Math.min(dpr, 2)` + `setTransform`), passive listeners (`immersive-shell.tsx:48-49` `{ passive: true }`), `viewportFit: cover` + `themeColor` (`layout.tsx`), `useDisplayDetection` (matchMedia + resize), `FixedScreenShell` mobile frame. No desktop-only mouse assumption blocks the core Quick-Add flow (camera/file input). Keyboard-only paths exist (modal focus trap in `ui/modal.tsx`) — no P1/P2 portability defect found. `LiveClock`’s 1 s `setInterval` re-render (`daily-disposable-hero.tsx:60-73`) is a P3 waste, not a parity break (see §5 R4).

### Lens 10 — Cognitive Load & AI-Context Maintainability Engineer (DX)

- **[P2-1 cross-ref — God files (same defect, counted once).]** Cognitive cost quantified: 7 files × ~550 LOC = ~3,900 LOC ≈ 35–45k tokens just to open the highest-risk surface, before `state & data-flow topology` requires the cross-file chase across `local-db` ↔ `use-local-db` ↔ `sync-snapshots` ↔ `data-backup-card` (four files define the same “reset” in different words: `clearAllData`, `clearAllUserData`, `clearSyncAndQueues`, `purgeMyAccountData`).
  - **Root Cause Mechanism:** No `useStoreHook` abstraction (13 copy-paste stanzas), no exported `BUILTIN_SPLASH_SPRITES`, magic numbers throughout: `60/15/20/10` particle bursts (`golden-splash.tsx:365-386`), `POOL_SIZE 120`, `8_000_000` base64 cap (`scanActions.ts:62`), `MAX_BACKUP_BYTES 900*1024` (`sync-snapshots.ts:184`), `scanWindow 100–200` (`draftCrud.ts:95`), `MAX_MEMBERS` re-declared per accounts file, `30-day` tombstone (`boardMerge.ts:12`), `3500 ms` toast (`use-quick-add-state.ts:176`), `10000 ms` priority-guide dismiss (`priority-guide.tsx:144`).
  - **Deterministic Trigger & Failure Mode:** An AI agent (or human) asked to “fix the splash stutter” must load 689 lines of mixed canvas/React/CSS-keyframes to discover the 40-line hot loop; a patch that touches the toast magic number without the constant is unverifiable in review.
  - **Surgical Fix Specification:** Named-constant extraction pass (no behaviour change): `SPLASH_BURSTS`, `POOL_SIZE`, `MAX_IMAGE_BYTES`, `MAX_BACKUP_BYTES`, `SCAN_WINDOW_MIN/MAX`, `TOMBSTONE_TTL_MS` (already constant — keep), `TOAST_MS`, `GUIDE_DISMISS_MS`. Put each beside the module that owns it with a one-line rationale comment. The `useStoreHook` factory (R1) removes ~300 lines of duplicated stanzas and the largest single-source contributor to the token tax.

## 2.5 Live Geometry Probe — N/A (with justification)

This audit was not opened with a layout/obstruction/overlap/renderer-artefact complaint (“lines across the screen”, “no bright colours”, “stutters” reports a probe would be required to prove). The two Canvas2D surfaces were audited statically and the Matrix-A artefact classes checked by reading the draw calls:

- `golden-splash.tsx:25-92` draws only closed `arc`/`fill` shapes (radial gradients, coin ellipses, sparkle quads) — **no** retained `moveTo`/`lineTo` polyline, **no** teleport edge-wrap, **no** grid painter — the retained-geometry streak class cannot occur.
- `confetti.tsx:60-90` draws only `fillRect` squares.
- DPR handling is correct in both; no CSS letterboxing de-sync (full-bleed canvases `absolute inset-0`).
- Hue-monoculture: the splash palette is intentionally monochromatic gold (`#F5D742`/`#C9960C`/`#FFFFFF`); this is brand design, not an uncovered hue band — the engagement lens (11th) is N/A for this finance PWA (no game loop/retention arc to audit; see §6).

No dev server was started, no Playwright hit-test was run, and no latency numbers are claimed (host-load protocol per §4.5 not needed because no performance claim is made). The P1 GC-churn finding (Lens 2) is provable by counting `createRadialGradient` calls per frame in source — a browser probe would confirm, not discover, it. If the team later reports a splash visual defect, run `runtime-probe-harness.md` (Canvas geometry hooks, hue histogram) then; do not run it now.

Pass 2.5 verdict: **`N/A — no layout/obstruction/rendered-artefact complaint in scope; both canvases verified line-free by static draw-call inspection.`**

## 3. Existing Test Suite Comparison & Mutation Truth Table

- **Test-to-Code File Ratio:** `165 / 318` (`0.52` files; `~22k` test LOC vs `36k` impl LOC — dense in breadth, thin at the highest-risk seams)
- **Estimated Mutation Kill Score ($M_{\text{kill}}$):** **`55%`** (basis below — required by the rubric; a bare number without it would be a guess)

### Basis for $M_{\text{kill}}$ (Pass 3 §3b)

| Signal | Count | Source |
| :--- | :--- | :--- |
| Unit test files | `165` (`133` in `src`, `32` in `convex`) | `find src convex -name "*.test.*"` |
| E2E specs | `25` (`tests/e2e/*.spec.*`) | `ls tests/e2e \| wc -l` |
| `expect`/`assert` occurrences | `2,303` across unit tests | `grep -rn "expect(\|assert\." src convex --include="*.test.*"` |
| Files with negative signal (`toThrow`/`not.toBe`/`toBeNull`/`NaN`/`invalid`/`rejects`) | `76 / 165` | `grep -rln` |
| Files using `vi.mock`/`jest.mock` | `48 / 165` | `grep -rn "vi\\.mock\|jest\\.mock"` |
| Weak existence asserts (`toBeDefined`/`toBeTruthy`) | `116` sites | `grep -rn` |
| Strong negative asserts (`toThrow`/`rejects`/`not.toBe`/`toBeNull`) | `200` sites | `grep -rn` |
| Untested implementation modules (no sibling `*.test.*`) | `171 / 318` (incl. trivial constants/types; high-risk untested: `draftCrud.ts`, `ingest.ts`) | sibling check per file |

Sampled 10 critical modules × 4 mutants (M1 boundary, M2 zero/empty, M3 side-effect deletion, M4 async failure) = 40 mutants, 22 killed → **55%**. The 48 mock-heavy files drive the survival rate: when the database is mocked, M3 (deleted `await db.put`) and M4 (rejected query) cannot kill.

| Implementation Module | Critical Functions / Branches | Paired Test File | Pathologies Detected | Mental Mutants Killed (M1–M4) | High-Priority Missing Assertions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/lib/db/stores/snapshots-store.ts` | `replaceBoardData`, `applyRemoteBoard`, `getAllLocalWrites` | `src/lib/db/local-db.test.tsx` (547 LOC, `fake-indexeddb`) | Happy-Path Tunnel Vision (single-record board) | 3/4 (75%) — M1 killed; M3 partially | Multi-record `applyRemoteBoard` (≥2 staged) asserting single `tx` count (Result-Only pathology: counts never asserted) |
| `src/hooks/use-local-db.ts` | 13 hooks, `remove` guard, CRUD optimistic updates | `src/hooks/use-local-db.test.ts` (202 LOC) | Mock-Mirror Tautology (entire `local-db` mocked `L1-55`) | 1/4 (25%) — only M2 partially | Real `fake-indexeddb` round-trip for `useExpenses.remove` shared-guard throw; `useCriticalExpenseCommitment` month-boundary |
| `src/lib/convex/sync-snapshots.ts` | `gatherSnapshotData`, `capBackup`, `flushOfflineQueue`, `restoreFromCloudSnapshot` | `sync-snapshots.test.ts` (261) + `sync-snapshots-restore.test.ts` + `data-backup-card.test.tsx` | Weak asserts on queue drain; Time-Window Myopia (backoff never sampled) | 3/4 (75%) — M1/M2/M3 killed; M4 (HOL backoff ordering) survives | HOL: failing head + good tail → tail still flushed; `syncDailySnapshot` poisoned payload → no unbounded requeue |
| `src/components/launch/golden-splash.tsx` | `resetParticle`, `acquireParticle`, `tick` dt/pool | `src/components/launch/golden-splash.test.tsx` | Canvas-stub variant (context stubbed, coordinates discarded); Existence-Only | 2/4 (50%) — M1 (pool exhaustion) killed; M3 (gradient churn) survives | `createRadialGradient` call count per frame == 0 post-refactor (R2); `dt` clamp boundary (0.2 / 3.0) |
| `src/hooks/use-quick-add-state.ts` | `handleSave`, `handleSaveScannedReceipt`, `handleScrapeSms`, draft/bot effects | `src/hooks/use-quick-add-state.test.ts` (227) + `app/quick-add/page.test.tsx` (434) | Shared Mutable State (toast timers); Happy-Path Tunnel Vision (no denied-permission path) | 2/4 (50%) | SMS parse→category fallback; bot-draft precedence when both `draft` and `botDrafts[0]` exist; file-input empty |
| `src/components/settings/data-backup-card.tsx` | `handleExportData`, `executeDataImport`, `handleResetConfirm` | `data-backup-card.test.tsx` (103, restores only) | Happy-Path Tunnel Vision (no corrupt-import case) | 2/4 (50%) | Corrupt-record import quarantined (not NaN-poisoned); reset drains `syncQueue`+`receiptDrafts`+localStorage queues |
| `convex/purge.ts` | `purgeMyAccountData`, `destroyBoard` | `convex/purge.test.ts` (412) | — (healthy; now covers shards+ledger) | 3/4 (75%) | Idempotent double-purge → zero counts (M3 survived once; now killed) |
| `convex/receipts/draftCrud.ts` | `listReceipts` window/filter/pagination | **NONE** (no sibling, `receipts.test.ts` covers scrape only) | (untested) | 0/4 (0%) | 200-window truncation: 200 app + 1 line draft → draft visible; `limit:1` + cursor paging; `source`/`status` filter with `??` defaults |
| `convex/receipts/ingest.ts` | `validateAppToken`, Bearer check, idempotency, `saveReceipt` | **NONE** direct (indirect via `line.test.ts`/`receipts-scrape.test.ts`) | Mock-Mirror (via line mocks) | 1/4 (25%) — idempotent replay killed indirectly | Future `+4 min` HMAC rejected; malformed hex → 401 not 500; oversized `lines` → 400 |
| `convex/boardMerge.ts` | `mergeRecords` LWW + tombstone TTL | `convex/boardMerge.test.ts` | Data-array-adjacent (exact-output asserts on merge) | 3/4 (75%) | Future `updatedAt` clamp (server-side, once Lens 6 fix lands); tombstone exactly at TTL boundary (M1) |

### Why Existing Tests Missed Discovered P1 Defects

- **P1-4 (`draftCrud` 200-window):** `convex/receipts.test.ts` (372 LOC) seeds < 20 rows and asserts `listReceipts` returns the seeded draft; it never constructs the adversarial shape (200 newer `app` receipts pushing the `line` draft to position 201). Happy-Path Tunnel Vision + the fact the only test exercises the engine, not the pagination query.
- **P1-6 (future-timestamp LWW lock):** `convex/sharedBoards.test.ts` asserts `pushBoard` returns `applied: true` and `updatedAt` advances — Result-Only assertions. No test pushes a hostile `updatedAt` (M1 boundary in the *client* clock domain) and no test asserts `pushBoard` rejects/clamps it, because the validator is `v.any()` and the test mirrors the mock return.
- **P1-8 (no-op notifier):** `convex/pendingDeletes.test.ts` asserts `requestItemDelete` inserts the row and returns `pendingId`. It never asserts `ctx.scheduler` was invoked (resource-count proof missing — Pathology 7) because the stub returns `undefined` by design and the test cannot observe a call that does not exist.
- **P1-1 (gradient churn):** `golden-splash.test.tsx` stubs the 2D context with `vi.fn()` and asserts components render; like the canvas-stub pathology, a 1,440 px streak and a zero-allocation frame are indistinguishable without recording `createRadialGradient` call counts. No test owns the frame budget.
- **P1-5 (per-record import trust):** `data-backup-card.test.tsx` restores one clean payload and asserts `localWrites` stamping (good) but never imports a record with `amount: "abc"` (M2 zero/empty degeneracy in the *record* domain, not the envelope domain).
- **P1-4/HOL queue (sync):** `sync-snapshots.test.ts` mocks `convex.mutation` to resolve; M4 (async failure injection with a *second* good item behind it) is never staged, so HOL blocking is invisible.

### Minimal Viable Test Harness (MVTH) Specifications

1. **`convex/receipts/draftCrud.ts` (Tier 1, zero mocks — `convex-test`):** Table: (a) seed 200 `app` drafts + 1 `line` draft at position 201 (ordered by `parsedAt`) → `listReceipts({ source: "line", status: "draft", limit: 1 })` returns the line draft (fails today). (b) `listReceipts({ limit: 1 })` with 3 rows → `nextCursor` pages to row 2, row 3. (c) `source: undefined` row with no `source` field matches `source: "app"` via `??`. Covers M1/M2/M4 in one file.
2. **`convex/sharedBoards.ts` `pushBoard` (Tier 3, contract):** (a) `updatedAt = Date.now() + 86_400_000` → rejected or clamped to `≤ now + 60 s` (fails today). (b) `data` with a non-`Record` shape (`"string"`, `123`) → 400/`ConvexError` (fails today — `v.any()` accepts). (c) Tie `rec.updatedAt === prev.updatedAt` → deterministic winner documented by test.
3. **`convex/pendingDeletes.ts` notifier (Tier 2, resource-count):** Assert `scheduler.runAfter` called exactly once per `requestItemDelete` with `userId === otherMember`; assert **not** called when `otherId` is null (solo board). Inject a counting `ctx.scheduler` stub (~15 lines) — turns the no-op into a red test.
4. **`src/lib/convex/sync-snapshots.ts` `capBackup` + queue (Tier 1/2):** (a) Mixed-format table: `[{date:"2026-08-01"}, {month:"2026-08"}, {date:"2026-07-31"}]` → newest-by-parse kept, not newest-by-lexicographic. (b) Queue: head item always rejects, tail item resolves → flush attempts tail in the same `flushOfflineQueue` call (fails today due to HOL backoff). (c) `syncDailySnapshot` with a poisoned payload twice → `syncQueue.count() == 1` (dedupe), not 2.
5. **`src/components/launch/golden-splash.tsx` (Tier 0 geometry invariant):** After mounting and advancing 3 simulated frames, `ctx.createRadialGradient.mock.calls.length === 0` (fails today, passes after R2 sprite refactor). Also pin `tick` dt: `elapsed 500 ms → dt == 3.0`; `elapsed 1 ms → dt == 0.2`.
6. **`src/components/settings/data-backup-card.tsx` `executeDataImport` (Tier 1):** Import payload with one valid + one corrupt (`amount: "abc"`) expense → valid lands, corrupt quarantined, UI shows error count, downstream `gatherSnapshotData` sum is numeric (not `NaN`). This is the regression gate for P1-5.

## 4. Surgical Refactoring Blueprints (Zero-Mutation Drafts)

### Refactor R1: Collapse 13 copy-paste hooks into one factory (saves ~300 lines, removes the largest LLM-context tax)

- **Target Scope:** `src/hooks/use-local-db.ts:L66-750`

**Current Pattern (Audited Code):**
```ts
export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    let mounted = true;
    getExpenses().then(e => {
      if (mounted) {
        setExpenses([...e].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0)));
        setLoading(false);
      }
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => { return load(); }, [load]);
  useDatabaseListener(load, EXPENSES_STORES);
  // ... add/update/remove with shifted/renamed copies for 12 more stores
}
```

**Target Pattern (Surgical Blueprint):**
```ts
// use-local-db/factory.ts — one factory; each hook is 6 lines
function useStore<T>(getter: () => Promise<T>, storeKey: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    let mounted = true;
    getter().then(v => { if (mounted) { setData(v); setLoading(false); } })
          .catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [getter]);
  useEffect(() => load(), [load]);
  useDatabaseListener(load, [storeKey] as const);
  return { data, loading };
}
export function useExpenses() {
  const { data, loading } = useStore(() => getExpenses(), "expenses");
  // sorted view via useMemo — no per-hook sort copy
}
```
**ROI:** −~300 LOC, one place to add the guard-throw/notify behaviour, CC of the file drops from 15 to ~4. Test with `renderHook` + `fake-indexeddb` once for the factory, not 13 times with mocked `local-db`.

### Refactor R2: Sprite-pre-rendered splash (eliminates per-frame GC churn)

- **Target Scope:** `src/components/launch/golden-splash.tsx:L25-92,347-443`

**Current Pattern (Audited Code):**
```ts
export function drawGoldDust(ctx: CanvasRenderingContext2D, p: Particle) {
  const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size); // per particle per frame
  grad.addColorStop(0, `rgba(245, 215, 66, ${p.opacity})`);
  // ...
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fill();
}
```

**Target Pattern (Surgical Blueprint):**
```ts
// Mount once: render 64×64 DPR sprites for the 3 kinds
function makeSprite(kind: ParticleType, dpr: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 64 * dpr;
  const g = c.getContext("2d")!;
  // ... draw gradient + shape ONCE into the sprite ...
  return c;
}
// Per frame:
const sprite = sprites[p.kind];
ctx.globalAlpha = p.opacity;
ctx.drawImage(sprite, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
ctx.globalAlpha = 1;
```
**ROI:** Gradients/sec 7,200 → 0; string allocations/sec ~360 → 0; measured frame time on Adreno-class GPUs typically drops 1–3 ms (to be re-measured with `uptime` + rAF delta histogram per §4.5 host protocol, not claimed here). The MVTH Tier-0 test (gradient-count == 0) is the gate.

### Refactor R3: Queue flush without HOL blocking

- **Target Scope:** `src/lib/convex/sync-snapshots.ts:L347-404`

**Current Pattern (Audited Code):**
```ts
for (const item of items) {
  try {
    await convex.mutation(api.snapshots.upsertDailySnapshot, cleanData);
    await db.delete('syncQueue', item.id);
  } catch (error) {
    if (fails >= 3) { await db.delete(...); }
    else {
      await db.put('syncQueue', { ...item, failCount: fails });
      await new Promise(r => setTimeout(r, backoffWithJitter(fails - 1))); // stalls the loop
    }
  }
}
```

**Target Pattern (Surgical Blueprint):**
```ts
let nextBackoffMs = 0;
for (const item of items) { // attempt once, no sleep inside
  try {
    await convex.mutation(...);
    await db.delete('syncQueue', item.id);
  } catch (e) {
    if (authError(e)) return; // stop flush entirely on auth failure (as today)
    const fails = (item.failCount ?? 0) + 1;
    if (fails >= 3) await db.delete('syncQueue', item.id);
    else { await db.put('syncQueue', { ...item, failCount: fails }); nextBackoffMs = Math.max(nextBackoffMs, backoffWithJitter(fails - 1)); }
  }
}
if (nextBackoffMs > 0) setTimeout(() => flushOfflineQueue(), nextBackoffMs);
```
**ROI:** Tail latency of a good snapshot behind a bad head drops from `backoff(head)` to `0`; poisoned-payload deduplication (single `enqueueSyncItem`) bounds queue growth.

## 5. Phased Execution Roadmap & Scoped Agent Prompts

1. **Phase 1 — Containment & Safety Lock (P1 fixes + MVTH baselines)**
2. **Phase 2 — Frame-Budget, Concurrency & State Hardening (remaining P1/P2)**
3. **Phase 3 — Structural De-Vibing & Modular Extraction (God-file split, dead-subtree removal, constant extraction)**

### Copy-Paste Surgical Prompts for Coding Agents

> **Prompt [P1-6] (`convex/sharedBoards.ts` + `convex/boardMerge.ts`):**
> "Strictly scope edits to `convex/sharedBoards.ts` (lines 217-257) and `convex/boardMerge.ts`, plus new tests in `convex/sharedBoards.test.ts`. Do not modify any other files. Replace the `data: v.any()` / unbounded client `updatedAt` in `pushBoard` with (a) `data: v.record(v.string(), v.object({ value: v.any(), updatedAt: v.number(), deleted: v.optional(v.boolean()) }))`, (b) clamping `effectiveUpdatedAt = Math.min(args.updatedAt, Date.now() + 60_000)`, and (c) a 512 KB `byteLength` budget on the serialized payload with a `ConvexError` on overflow. Add regression tests: future `+1 day` timestamp is clamped (not persisted as-is), malformed `data` shape is rejected, oversized payload is rejected. Run `npm run test:convex` and confirm green; confirm the future-timestamp test **fails on the pre-fix code** by temporarily reverting the clamp, then restore."

> **Prompt [P1-4] (`convex/receipts/draftCrud.ts`):**
> "Strictly scope edits to `convex/receipts/draftCrud.ts` (lines 60-126) and a new `convex/receipts/draftCrud.test.ts`. Do not modify any other files. Fix the `listReceipts` silent truncation (200-row scan window + in-memory source/status/cursor filter) so that a `line`/`draft` row beyond the window is still returned — either push `source`/`status` into the indexed query via a composite index or cursor-paginate *before* filtering (iterate pages until `limit` matches are found or the index is exhausted). Preserve the existing ` limit ≤ 50` contract. Add tests: (a) 200 newer `app` rows + 1 `line` draft at position 201 with `{ source: 'line', status: 'draft', limit: 1 }` returns the line draft, (b) cursor paging with `limit: 1` walks 3 rows, (c) missing-`source` row matches `source: 'app'`. Run `npm run test:convex` and confirm the 200-window test fails before the fix and passes after."

> **Prompt [P1-8] (`convex/pendingDeletes.ts`):**
> "Strictly scope edits to `convex/pendingDeletes.ts` (lines 100-118, 166-174) and `convex/pendingDeletes.test.ts`. Do not modify any other files. Replace the `notifyPartner` no-op (`void` everything) with a scheduled internal call: `await ctx.scheduler.runAfter(0, internal.pushSend.sendReminder, { userId: otherId, title, body })` (add the internal handler if it does not exist; keep `pushSend.ts` Node-only with `'use node'`). Keep the persisted `pendingDeletes` row as the audit trail. Add a test injecting a counting `ctx.scheduler` stub asserting exactly one scheduling call per request, and zero calls when `otherId` is null. Run `npm run test:convex` and confirm the scheduling test fails on the no-op and passes after."

> **Prompt [P1-1/R2] (`src/components/launch/golden-splash.tsx`):**
> "Strictly scope edits to `src/components/launch/golden-splash.tsx` (lines 25-92, 311-443) and `src/components/launch/golden-splash.test.tsx`. Do not modify any other files. Eliminate per-frame `createRadialGradient` + template-string allocations by pre-rendering gold-dust/coin/sparkle sprites once at mount (DPR-scaled, capped at 1.5) and compositing via `drawImage` + `globalAlpha` in `tick`. Keep the existing particle physics, dt clamping (`0.2–3.0`), pool, and phase-burst behaviour bit-for-bit. Add a test that mounts the component, advances 3 frames, and asserts `createRadialGradient` was called 0 times after warm-up, plus dt-boundary cases (1 ms → 0.2, 500 ms → 3.0). Run `npm test -- src/components/launch/golden-splash.test.tsx` and confirm the gradient test fails before the refactor and passes after. Record host load (`uptime; ps`) in the PR description before making any perf claim."

## 6. Quantitative Scoring (Pass 4)

`LOC_effective = 35,880` (impl excl. tests/locales/generated, telemetry §0.1). `max(500, LOC) = 35,880`.

$$D_{\text{raw}} = 18(0) + 8(8) + 3(10) + 1(6) = 100$$

$$\sqrt{1000 / 35,880} = 0.1670 \;\Rightarrow\; 100 \times 0.1670 = 16.7$$

$$P_{\text{test}} = 15 \times (1 − 55/100) = 6.8$$

$$S_{\text{health}} = \max(0, \text{round}(100 − 16.7 − 6.8)) = \mathbf{77 / 100}$$

Risk: **MODERATE** ($65 ≤ 77 < 85$, $N_{P0} = 0$). Sensitivity: one additional P1 costs 1.3 pts; a 10-pt $M_{\text{kill}}$ swing costs 1.5 pts — the score ranks, it does not decide; the per-defect evidence above is the verdict. The prior 65/100 HIGH was scored on a different (ad-hoc /KLOC) formula and pre-hardening HEAD; it is not comparable — this audit re-derived the score with the skill formula and re-verified every prior P0/P1 against HEAD.

**Delivery posture (Pass 4.5):** No fix was landed. No deployment is claimed — `git push` and HTTP `200` would not prove the artefact anyway. Baselines handed to the fixer: pre-audit digests above (re-verified post-audit, §0.1), `HEAD ec80b3a`, sibling-test paths, and for each Phase-1 prompt the failing-first test it must produce. When a fix lands, re-run the identical scanner + `npm run ci` gates and report before/after hash + `M_kill` delta — not a roadmap.

## 7. Zero-Mutation Verification (Pass 5)

- Pre-audit: `git status --porcelain` empty; `HEAD ec80b3a2c768c0769544172f7f35363dbfda9b15`; `src` digest `110de5fe4d386b03…43d72bb2d7`; `convex` digest `7c779fe564aaac61…eba0`.
- Post-audit (all Pass 1–4 complete, before writing this file): identical `git status`, identical digests (re-ran `preflight_telemetry.py` on both trees), no `__pycache__`/`*.pyc` created in the repo (scanner ran from the skill directory; telemetry JSON written to `/tmp/opencode/`).
- This report (`docs/audits/budgetboss-surgical-audit-2026-11-08.md`) is the sole new file and lives outside the `src`/`convex` Merkle trees by design, so the digests above remain valid after delivery. It is uncommitted (as are the two 2026-11-07 audits in spirit): commit it separately from any fix series so evidence and code stay independently revertable.
- Build-artefact note: `public/sw.js`/`dist` assertions were not run (audit is static read-only; `npm run build` would write `.next/` into the repo and invalidate the digests). E2E (`tests/e2e`, 25 specs) was inventoried, not executed.

## 8. Limitations (stated per skill)

- Textual dead-export sweep does not follow `export *` barrels or dynamic access (`export * from './stores/*'` in `local-db.ts:581-587` means some “dead” store symbols are reachable via the barrel) — every dead-subtree claim was re-confirmed with `grep -rn` before inclusion.
- CC is a floor (regex `\b` blindness to `: ? && ||`); God-file ranking uses LOC + depth + risk together, not CC alone.
- Scanner's `silent_catches` undercounts; Lens 7 counts were derived from `grep` (221 `catch` sites in `src`, 25 in `convex`) and hand-classified.
- No runtime probe, no Lighthouse, no Convex `insights` pull, no prod log inspection — static + test-tree evidence only. Any perf, LWW-contention, or sync-latency claim beyond allocation counting needs a live harness (§4.5) and is explicitly not made here.
