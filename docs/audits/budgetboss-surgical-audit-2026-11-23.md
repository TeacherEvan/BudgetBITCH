# Surgical Audit Report: Budget Boss (`BudgetBITCH`)

| Audit Metadata | Specification |
| :--- | :--- |
| **Audit Date** | 2026-11-23 |
| **Audited Scope** | `src/**`, `convex/**`, `public/sw.js`, `next.config.mjs`, `vercel.json`, `package.json`, `scripts/**` (`340` implementation files / `38,778` effective impl LOC; `564` files total scanned / `62,952` effective LOC incl. tests, locales, vendor; `196` test files; `0` standalone inline-HTML app files) |
| **Tech Stack & Runtime** | TypeScript strict, Next.js `16.3.1` (App Router), React `19.2.8`, Convex `1.44+` (`@convex-dev/auth`), IndexedDB (`idb` v8), Service Worker PWA, Capacitor `8.5`, Tailwind CSS v4, Framer Motion `13`, Tesseract.js `7`, Gemini 2.5 Flash, Vitest `5.1`, Playwright `1.59` |
| **Pre/Post Audit SHA-256** | `13f760a8a34f768` / `13f760a8a34f768` (`HEAD 2047ce5b793e9e2ef8544fa59c232ab3b192c533`, `git status --porcelain` unchanged — **VERIFIED ZERO MUTATION**) |
| **Deterministic Health Score** | **`43 / 100`** (`D_raw = 304`, `LOC_effective = 38,778`, `scale = 0.160586`, `P_test = 7.77`, `M_kill = 48.21%`; like-for-like prior-count score `64 / 100`) |
| **Vibe-Debt Risk Level** | **`CRITICAL`** (`N_P0 = 4 >= 2` overrides score band; 51 open defects across 10 lenses) |

> **Relationship to the 2026-11-19 audit.** `HEAD` is byte-identical to the prior audit (`2047ce5b`), so all prior findings remain open and are carried forward below with `[C]` IDs. This audit independently **re-verified** a representative sample of them against source and the installed Next.js 16 docs (P0-1 confirmed) and added **24 newly discovered, source-verified defects** with `[N]` IDs. New findings were cross-checked by reading the actual cited lines; subagent claims that overlapped prior findings (e.g. `share-target` unbounded redirect) were deduplicated rather than double-counted.

## 1. Executive Architecture & Vibe-Debt Triage

Budget Boss is a local-first Next.js 16 + Convex personal-finance app whose dominant failure mode is **a split-brain between what the UI displays and what the data layer persists**, compounded by **non-atomic write paths across IndexedDB, Convex, and React state**. The receipt pipeline is the epicentre: a completed scan can save the wrong date/category, skip the user's final correction, write an expense the user explicitly cancelled, and display an FX conversion that is never applied — all while 1,024 green tests pass. In parallel, multi-board sync has three independent last-write-wins integrity holes (stale LWW clock read, timestamp re-stamping on checkpoint restore, account-blind cloud snapshots) that can overwrite a partner's or another board's data. The trust boundary is the second critical region: four carried-forward P0s (dead nonce CSP, stale sync-queue replay, unexpired invites, unverified LINE linking) are joined by three new backend defects (unvalidated `accountId` on LINE link, an oldest-16 invite window that bypasses the member cap, and outstanding invites that let a removed member rejoin). The test suite is high-volume but assertion-shaped for happy paths: `M_kill ≈ 48%`, and **every one of the 24 new defects survived the full green gate** (typecheck clean, lint 0 errors / 4 warnings, 784 unit + 240 Convex tests passing).

| Severity Tier | Count | Deduction Weight | Primary Failure Domains |
| :--- | :--- | :--- | :--- |
| **P0 — Critical (Crash / Data Loss / Security / Leak)** | `4` | `-18 pts ea` (`-72`) | `src/app/proxy.ts` dead nonce CSP + `vercel.json` `'unsafe-inline' 'unsafe-eval'`; `sync-snapshots.ts` stale queue replay; `accountInvites.ts` no 7-day expiry; `line.ts` unverified LINE pre-claim |
| **P1 — High (Data Loss / Race / Logic / Trust)** | `21` | `-8 pts ea` (`-168`) | Receipt review save/cancel/answer races, FX-not-applied, 3 sync LWW/restore holes, LINE webhook idempotency race + unvalidated `accountId`, invite cap window + rejoin, plus 10 carried-forward P1s (pagination, purge, OCR, camera, etc.) |
| **P2 — Medium (Non-atomicity / Lifecycle / Debt)** | `19` | `-3 pts ea` (`-57`) | Queue erasure on unlink, all-origin cache deletion, split income stamping, net-worth lost updates, non-atomic lock rotation, unthrottled push, UTC dates, decimal inputs, OCR intrinsic-size, unvalidated answers, plus carried-forward P2s |
| **P3 — Low (Magic Constants / DX / Portability)** | `7` | `-1 pt ea` (`-7`) | `v.string()` cast, LINE category vocabulary drift, 500-row verification cap, plus carried-forward P3s |

### High-Risk File Telemetry Hotspots

| File Path | Effective LOC | CC / Branch Density | Silent Catches | Primary Vibe-Debt Signature |
| :--- | :--- | :--- | :--- | :--- |
| `src/lib/db/local-db.ts` | `564` | `26 / 0.044` | `7` | Central IDB schema + 7 swallowed catches; no `versionchange` handler |
| `src/hooks/use-quick-add-state.ts` | `868` | `52 / 0.057` | `0` | God hook: 3 scan tiers, LINE drafts, SMS, FX display/save split-brain |
| `src/components/settings/data-backup-card.tsx` | `603` | `13 / 0.022` | `3` | Monolithic backup/restore/wipe mixing crypto + cloud + storage |
| `src/components/launch/golden-splash.tsx` | `701` | `41 / 0.064` | `0` | God canvas: ghost `ctx.stroke()`, 144 Hz spawn drift, reduced-motion bypass |
| `src/hooks/use-local-db.ts` | `672` | `15 / 0.021` | `0` | Monolithic 9-hook barrel; duplicate hook exports (split-brain) |
| `src/lib/convex/sync-snapshots.ts` | `447` | `18 / 0.043` | `0` | Account-blind snapshots + stale queue replay + restore side effects |
| `convex/line.ts` | `426` | `54 / 0.127` | `0` | Unverified link + unvalidated `accountId` + idempotency release race |
| `convex/accounts/accountInvites.ts` | `386` | `67 / 0.171` | `0` | No expiry at redeem; oldest-16 window; no revoke on member removal |
| `src/components/quick-add/quick-add-camera-sheet.tsx` | `362` | `37 / 0.105` | `2` | Black-frame capture; dead `streamError` UI |
| `convex/purge.ts` | `366` | `50 / 0.139` | `1` | Unbounded `while (true)` delete phases |
| `src/lib/db/stores/snapshots-store.ts` | — | — | — | `applyRemoteBoard` stale LWW clock + post-commit stamping |
| `src/app/quick-add/page.tsx` + `receipt-verify-sheet.tsx` | — | — | — | Cancel/Skip/confirm all funnelled into one save callback |

*(Vendored `public/tesseract/worker.min.js` and static `src/i18n/locales/*.ts` catalogs excluded from code hotspots.)*

---

## 2. The 10-Principal-Engineer Deep Audit

### Lens 1 — Systems Architect

- **[P1-N4] FX conversion is displayed but never persisted; Thai (THB) receipts show no number** — `src/components/quick-add/scanned-receipt-card.tsx:L80-L103`, `L157-L175`; `src/hooks/use-quick-add-state.ts:L400-L460`; `src/components/dashboard/currency-options.ts:L35-L52`; `src/lib/types/budget.ts:L100-L126`
  - **Root Cause Mechanism:** `fxConversion` computes `convertedAmount` and renders `THB 1000 ≈ USD 28.50`, but `handleSaveScannedReceipt` passes the raw `roundedAmount` to `addExpense`; `ExpenseEntry` has no `currency` or `originalAmount` field, so the display and persistence layers disagree. `FALLBACK_RATES` omits `THB` although `CurrencyCode` includes it and Thailand is an explicit OCR/locale target, so `rateFrom` is `undefined` and `convertedAmount` stays `null`.
  - **Deterministic Trigger & Failure Mode:** Scan a 1,000 THB receipt on a USD/ZAR board → either no converted figure or a figure that is not what is saved; the ledger records `1000` in the board currency (~35× inflation).
  - **Surgical Fix Specification:** Pick one invariant and enforce it. Preferred: extend `ExpenseEntry` with `currency` + `originalAmount`, compute `convertedAmount` via a shared `convertCurrency()` used by both card and save path, and add `THB` to `FALLBACK_RATES`. If the badge must remain informational, change its copy to state that the original amount is what gets saved.

- **[P1-N7] Daily cloud "backup" is account-blind and auto-restore hijacks the active board** — `src/lib/convex/sync-snapshots.ts:L87-L169`, `L223-L269`, `L454-L466`; `src/components/accounts/account-sync-mount.tsx:L94-L130`; `convex/snapshots.ts:L45-L125`
  - **Root Cause Mechanism:** The storage key is `(userId, date)` while `gatherSnapshotData()` serializes only whichever board is active. Syncing board B patches the same `(user, today)` doc, deleting A's only backup. `AccountSyncMount` auto-restores "the latest snapshot" without checking `snapshot.accountId`, and `restoreFromCloudSnapshot` calls `setCurrentAccountId(snapshot.accountId)` then overwrites the 8 stores.
  - **Deterministic Trigger & Failure Mode:** Sync A, switch to B, sync B on desktop; reload mobile while A is active → auto-restore selects B's doc and switches `bb:currentAccount` to B. The user is silently on the wrong board; subsequent entries go to B.
  - **Surgical Fix Specification:** Add `accountId` to `getLatestSnapshot`/`listCloudSnapshots` and a `by_user_and_account_and_date` index; compare `latestSnapshot.accountId` with `getCurrentAccountId()` before auto-restoring; remove `setCurrentAccountId` from the auto path (keep only for explicit `force: true`).

- **[P1-N9] `linkLineAccount` persists a client-controlled, unvalidated `accountId`** — `convex/line.ts:L126-L165` (propagated at `L417-L424`, `L458-L463`, `convex/receipts/ingest.ts:L228-L239`)
  - **Root Cause Mechanism:** `accountId: v.optional(v.string())` is stored verbatim with no `accounts.by_accountId` lookup or `ownerId === userId` / `boardMembers` membership check; it is then trusted as the target account for every bot-ingested receipt.
  - **Deterministic Trigger & Failure Mode:** Attacker links `lineUserId = L` with the victim's `accountId`; the check at `L144` only rejects LINE IDs bound to a *different user*, so it succeeds. Bot receipts are attributed to the victim's account.
  - **Surgical Fix Specification:** In `linkLineAccount`, when `accountId` is present resolve it and require `acc.ownerId === userId` or a board-membership row; reject otherwise. Apply the same guard in `ingest.ts:238` as defence in depth.

- **[P2-N14] Dead export surface / duplicate split-brain names** — `src/lib/receipt/{preprocess,image-preprocessor}.ts`, `convex/lib/receipt/boardShards.ts`, `src/lib/db/accountStorage.ts` vs `stores/accounts-store.ts`, `src/hooks/{use-accounts,use-local-db}.ts`
  - **Mechanism:** `dead_export_sweep.py` reports `92` dead value exports, `90` test-only exports, `90` dead type exports, `3` dead barrels (`convex/accounts.ts`, `convex/accounts/index.ts`, `convex/receipts/index.ts`). `duplicate_export_names` includes `PreprocessResult` (two incompatible definitions), `ACCOUNTS_DATA_STORE`/`CURRENT_ACCOUNT_KEY`/`StashedAccount`, `useDatabaseListener`/`useNetWorth`/`useWizardProfile`, `Asset`/`Liability`/`NetWorthSnapshot` — each pair a divergent single-source-of-truth candidate.
  - **Fix:** Verify callers, consolidate each duplicated contract into one module, delete dead barrels, then re-run the sweep to zero for value exports.

### Lens 2 — Frame-Budget & Performance

- **[P1-C1] `listReceipts` O(N²) quadratic reads + broken `nextCursor` + `_creationTime` dedupe** — `convex/receipts/draftCrud.ts:L177-L262` *(carried, source re-checked)*
  - Growing `.take(Math.min(totalScanned + 50, 1000))` loop re-reads from index head: 1,000 rows cost 10,500 document reads. `checkTake ≤ 50` lookahead always hits already-seen rows → `nextCursor` permanently `null` past 50 rows; dedupe by `_creationTime` drops same-ms receipts.
  - **Fix:** Composite `by_user_source_status_parsedAt` index + single-pass `.take(limit + 1)` cursor bounded by `q.lt("parsedAt", externalCursorTime)`; dedupe by `_id`.

- **[P1-C8] Unbounded delete loops, multi-account snapshot collision, orphaned board rows** — `convex/purge.ts:L89-L166`, `L243-L393`; `convex/snapshots.ts:L49-L70`, `L206-L237`; `convex/accounts/accountCrud.ts:L417-L458` *(carried)*
  - **Fix:** Enforce one total-write budget (`ctx.meta.getTransactionMetrics()` reserve) across all phases and reschedule continuations; key snapshots by `(userId, accountId, date)`.

- **[P2-N1] `deleteAccount` uses unbounded `while(true)` loops** — `convex/accounts/accountCrud.ts:L417-L458` *(distinct from the carried orphan-row issue: this is the transaction-budget failure)*
  - **Mechanism:** Invite and board-member deletion loops stop only when a batch is `< 250` and never check transaction metrics or reschedule. Retained `accepted`/`declined` invite rows (see P1-N10) make boards accumulate hundreds of rows.
  - **Trigger:** Owner deletes a long-lived board → single mutation exceeds Convex write cap → deletion fails permanently.
  - **Fix:** Bounded `.take(100)` batch + `ctx.scheduler.runAfter(0, internal.accounts.continueDeleteAccount, { accountId, phase })`; bail with a metrics reserve.

- **[P3-N3] `verifyBoardTotal` silently caps the ledger at 500 entries** — `convex/lib/receipt/boardShards.ts:L110-L131`
  - **Mechanism:** `.take(500)` truncates the ledger total while the (unbounded) shard sum keeps growing, so `matches: false` is permanent on boards with >500 entries. Currently unreferenced in `convex/` (dead-code amplifier).
  - **Fix:** Maintain a denormalized `ledgerTotalMinor` counter updated in the same mutation as every ledger insert, or paginate with `BigInt` accumulation. Never derive a boolean from a bounded `.take()`.

### Lens 3 — Mathematical, Physics & Algorithmic

- **[P2-4C] `golden-splash.tsx` ghost stroke, 144 Hz spawn drift, reduced-motion bypass** — `src/components/launch/golden-splash.tsx:L122-L141`, `L487-L496`, `L562-L623` *(carried)*
  - **Fix:** `ctx.beginPath()` before the coin rim stroke; `spawnAccum += dt` accumulator instead of `frameCount % 3`; gate all CSS/Framer animations on `!prefersReducedMotion`.

- **[P2-N9] UTC date derivation produces off-by-one ledger dates** — `src/hooks/use-quick-add-state.ts:L269`, `L379`, `L413`, `L586`, `L601`, `L702`, `L757`, `L869`; `src/hooks/use-receipt-scan.ts:L183`
  - **Mechanism:** Nine sites use `new Date().toISOString().split('T')[0]` (UTC calendar day). `src/lib/utils/date.ts:L5-L11` already exports a local-time `toISODate()` that is never imported.
  - **Trigger:** UTC-8 user scanning at 20:00 on Nov 23 records `2026-11-24`; UTC+7 user at 01:00 records the previous day.
  - **Fix:** Replace all nine sites with `toISODate(...)`; for the bot-draft case derive from `bot._creationTime`.

- **[P2-N11] `preprocessImage` sizes its canvas from rendered width, not intrinsic width** — `src/lib/receipt/preprocess.ts:L10-L11`, `L13-L29`
  - **Mechanism:** For `HTMLImageElement`, `.width`/`.height` are layout dimensions. The Tier-3 caller passes a detached `Image`, so in browsers/jsdom that report `0` the canvas becomes `0×0`, `drawImage` is a no-op, and Tesseract recognizes an empty frame. The sibling `image-preprocessor.ts:137-138` guards with `naturalWidth || width || 1`.
  - **Fix:** `const origWidth = source instanceof HTMLImageElement ? (source.naturalWidth || source.width || 1) : source.width;` (same for height).

- **[P2-N10] Line-item amounts in the drafts list cannot contain decimals** — `src/components/receipt/receipt-drafts-list.tsx:L464-L472`
  - **Mechanism:** `onChange` applies `Number(e.target.value)` to a controlled input, so `"12."` coerces to `12` and re-renders as `"12"`; typing `"12.50"` yields `"125"`. Receipt-level amount/tax at `L318-L325`/`L379-L385` correctly keep strings.
  - **Fix:** Store line-item `amount` as a string while editing; parse with `Number(...) || 0` only at save; keep `step="0.01"`.

### Lens 4 — Concurrency, Async & Determinism

- **[P0-C2] Offline snapshot compaction orphans superseded `syncQueue` rows** — `src/lib/convex/sync-snapshots.ts:L362-L374` *(carried)*
  - Flush deletes only the compacted winner; superseded same-day rows replay later and overwrite the cloud backup backwards in time. **Fix:** delete `{winner.id, ...supersededIds}` atomically.

- **[P1-N5] `applyRemoteBoard` reads the LWW clock before its write transaction and stamps after commit** — `src/lib/db/stores/snapshots-store.ts:L231-L272`
  - **Mechanism:** `getAllLocalWrites()` opens its own read-only tx at `L232`; the comparison at `L243` uses that stale map, and `recordLocalWritesBulk()` at `L265-L271` writes stamps in a *separate transaction after* `tx.done` (`L260`). Contrast `restoreFromCloudSnapshot:549-L557`, which stamps inside the data tx.
  - **Trigger:** Remote `T1` arrives; local edit `T2 > T1` lands after the clock read → line 251 overwrites the just-saved local edit. Or a local save lands between `tx.done` and the bulk stamp → the next push serializes the new value with stale `T1` and is rejected by `mergeRecords`.
  - **Fix:** Include `localWrites` in the `readwrite` tx at `L238`; write applied stamps with `tx.objectStore('localWrites').put(...)` before `await tx.done`; delete the trailing bulk call.

- **[P1-N6] `restoreCheckpoint` stamps every restored record with `now`, turning a local rollback into a cloud-wide overwrite** — `src/lib/db/stores/checkpoints-store.ts:L64-L122` (damaging lines `L80-L84`, `L92`, `L102`, `L108-L113`)
  - **Mechanism:** `pendingWrites` uses `timestamp: now` for every record. `serializeBoardForSync` uses `localWrites` as per-record `updatedAt`, so restoring makes all records look newly modified; stamps are also written after `tx.done`, and stale stamps for restored stores are never cleared.
  - **Trigger:** Restore Monday's checkpoint after a partner's Tuesday edit → next push carries `Wednesday-now`, beating the partner's stamp in `mergeRecords`; a deleted expense is resurrected for everyone.
  - **Fix:** Persist each record's captured `updatedAt` at checkpoint creation; reuse it on restore; include and clear `localWrites` stamps inside the data tx.

- **[P1-N8] LINE webhook idempotency claim can be released after a duplicate delivery already skipped** — `convex/line.ts:L50-L75`, `L78-L89`, `L401-L409`, `L411-L476`
  - **Mechanism:** `releaseWebhookEvent` deletes *all* rows for the event id (`.take(20)`) on any transient failure, while a concurrent duplicate that lost the claim race simply `continue`s. The webhook always returns HTTP 200, so LINE never redelivers.
  - **Trigger (deterministic interleaving):** Delivery A claims and begins a slow content fetch; Delivery B loses the race and `continue`s; A's fetch fails → `committed = false` → `finally` deletes all claim rows. Result: no row, no processing, no redelivery — receipt silently lost.
  - **Fix:** State machine `processing | done | failed` with `attempts`/`nextRetryAt`; owner releases only its own inserted row id; schedule bounded retries; only `done` is final.

- **[P2-C2b] `useSharedBoard`/`useAccountSync` queue lost-update clobber + infinite retry + SSR hydration mismatch** — carried
- **[P2-N4] `flushQueue` clears the entire offline queue when `boardId` is momentarily null** — `src/hooks/use-shared-board.ts:L175-L205` (`if (!boardId) break;` at `L185`, unconditional `writeQueue(remaining)` at `L201`)
  - **Mechanism:** `break` on the first item leaves `remaining` empty; the `finally`-outside write persists `[]`, erasing every queued edit. `boardId` is null right after `unlink()` or while `getMyProfile` re-resolves.
  - **Fix:** Gate at the top with `if (!boardId) return;`, flush on null→non-null transition; otherwise push the item back before `continue`.

- **[P2-N6] Income writes split the record and LWW stamp across two transactions** — `src/lib/db/stores/incomes-store.ts:L6-L27`; `src/lib/db/local-db.ts:L261-L268`, `L349-L352`
  - **Mechanism:** All three income mutations do `add/put/delete` then `afterBoardMutation → recordLocalWrite` in a second tx; `recordLocalWrite` swallows all errors. A crash between them yields `updatedAt = 0`, so `mergeRecords` keeps the partner's version and the local income vanishes on next pull.
  - **Fix:** Use atomic `putWithStamp('incomes', income)` / `putWithStamp('incomes', null, id)` like expenses/bills/debts.

- **[P2-N7] `useNetWorth` mutates from React state, so two rapid additions lose one** — `src/hooks/use-local-db.ts:L507-L560`
  - **Mechanism:** Net-worth snapshots are keyed by date, so all changes write the same record; `addAsset`/`addLiability` build from render-time `baseSnapshot()` rather than re-reading IDB.
  - **Fix:** Re-read `getLatestNetWorthSnapshot()` immediately before assembling, or serialize through a ref-based promise chain.

### Lens 5 — Memory & Resource Lifecycle

- **[P2-C1] `URL.createObjectURL` blob leak per scan + SW unconditional timeout** — carried
- **[P3-C1] Web Audio suspended-context first-sound drop + unwired mute** — carried
- **[P2-N5] Service-worker `activate` deletes every Cache Storage entry on the origin** — `public/sw.js:L121-L135` (filter at `L128`)
  - **Mechanism:** Cache Storage is per-origin, not per-service-worker; the filter deletes all caches except the two `bb-*` names, including Next.js runtime/image caches and other co-hosted apps.
  - **Trigger:** Any version bump activates the SW → unrelated caches deleted → features degrade to network-only or fail offline.
  - **Fix:** `.filter((key) => key.startsWith('bb-') && key !== APP_SHELL_CACHE && key !== STATIC_ASSET_CACHE)`.
- **[P2-N8] Local lock: non-atomic salt/hash rotation can permanently lock the user out; no attempt throttling** — `src/lib/auth/local-lock.ts:L109-L123`, `L128-L159`
  - **Mechanism:** `setLocalPassword` writes `bb:localLockSalt` and `bb:localLockHash` as two `setItem` calls; failure between them leaves the old hash with the new salt → `hasLocalPassword()` true but `unlockLocalVault` can never derive the old hash. `unlockLocalVault` has no failed-attempt counter or cooldown.
  - **Fix:** Store one versioned JSON blob (salt + hash + iterations + version) in a single `setItem`; on failure remove the whole blob and leave unlocked. Add a persisted `failedAttempts` counter with exponential cooldown.

### Lens 6 — Security & Trust-Boundary

- **[P0-C1] Dead Next.js 16 nonce proxy + production CSP `'unsafe-inline' 'unsafe-eval'`** — `src/app/proxy.ts:L1-L71`, `vercel.json:L8-L9`, `next.config.mjs:L15-L18`, `src/app/layout.tsx:L86-L112` — **re-verified this audit**: installed docs (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`) state `proxy.ts` must be at the project root or inside `src` at the same level as `app`, i.e. `src/proxy.ts`; the file is at `src/app/proxy.ts` and is ignored. `check-csp-hosts.mjs` validates only `vercel.json`'s static string.
  - **Fix:** Move to `src/proxy.ts`, attach `nonce={(await headers()).get('x-nonce')}` to the speculationrules script, strip the static CSP from `vercel.json`, update the guard script and add a live-header E2E assertion.

- **[P0-C3] `redeemInviteToken` never enforces 7-day expiry; existing member burns token** — `convex/accounts/accountInvites.ts:L102-L113`, `L140-L176` *(carried)*
- **[P0-C4] Unverified `linkLineAccount` allows arbitrary LINE-ID pre-claiming** — `convex/line.ts:L126-L165` *(carried)*
- **[P1-C9] Gemini API key in query string, raw upstream errors forwarded, `alreadySynced` always false, legacy raw-secret HMAC** — `convex/lib/gemini.ts:L18-L20`; `convex/receipts/scanActions.ts:L148-L374`; `convex/receipts/ingest.ts:L71-L88`, `L269-L304` *(carried)*
- **[P2-C3] Weak local PBKDF2 + empty password + unbounded decrypt iterations + unauthenticated telemetry sink** — carried

- **[P1-N10] Invite cap and expiry sweep read only the oldest 16 invite rows** — `convex/accounts/accountInvites.ts:L83-L138` (same window flaw in `inviteByCode:L29-L43`) — **verified**
  - **Mechanism:** `.withIndex("by_board").take(MAX_MEMBERS * 2)` defaults to ascending `_creationTime` (oldest 16). `activeOutstanding` counts only `!r.toUserId` pending rows, so share-code invites are invisible; accepted/declined rows are never deleted, so once >16 rows exist the window is entirely historical.
  - **Trigger:** 7 outstanding `inviteByCode` tokens → cap computes `1 + 0 = 1 < 8` and issues unlimited tokens; after 16 rows a pending token is never swept to `expired`.
  - **Fix:** `by_board_and_status` index; query `status === "pending"` with `.take(MAX_MEMBERS + 1)`; move expiry to a scheduled paginated sweep.

- **[P1-N11] Removing/leaving a member does not revoke outstanding invites; the removed user can rejoin** — `convex/accounts/accountInvites.ts:L313-L410`, `L140-L293` — **verified by line range**
  - **Mechanism:** `removeMember`/`leaveAccount` delete the `boardMembers` row but never touch pending `invites`. `redeemInviteToken` checks only `isMember` and `status === "pending"`.
  - **Trigger:** B holds unused token T2 after redeeming T1; owner removes B; B redeems T2 → new `boardMembers` row, removal undone.
  - **Fix:** Cancel pending invites addressed to the departing user; add `boardEpoch` to `accountBoards`, embed in tokens, increment on every removal, reject stale epochs.

- **[P2-N3] `sendReminder` is an unthrottled public action with unbounded title/body** — `convex/pushSend.ts:L65-L78`
  - **Fix:** Cap `title`/`body` (120/500 chars) with checked validators and gate with `@convex-dev/rate-limiter` (e.g. 5/min/user).

- **[P3-N1] `removeMember` passes `userId: v.string()` cast to `Id<"users">`** — `convex/accounts/accountInvites.ts:L313-L315`, `L328` — a separate mutation from the carried `acceptInvite` issue.
  - **Fix:** Change to `userId: v.id("users")` and drop the cast.

### Lens 7 — Reliability & Fault Tolerance

- **[P1-N1] Cancel/Skip in the verification sheet saves the expense** — `src/app/quick-add/page.tsx:L231-L236`; `src/components/receipt/receipt-verify-sheet.tsx:L28-L43`, `L97-L103`, `L131-L137` — **verified**
  - **Mechanism:** The sheet's `onClose` is `() => s.confirmDraft()`. Both the `confirm`-kind **Cancel** and `entry`-kind **Skip** call `handleCancelOrSkip() → onClose()` — the same callback used after a successful answer run. `confirmDraft()` with no args calls `await addExpense(entry)`.
  - **Trigger:** Tier-3 scan yields ambiguous questions → tap Cancel/Skip → a receipt the user explicitly declined is written to the ledger and the Convex draft is confirmed.
  - **Fix:** Split intents: `onFinish={s.confirmDraft}` for the completed-answer branch; a new `cancelDraft` (no write, optionally delete server draft) for Cancel/Skip.

- **[P1-N2] The last answer is lost: fire-and-forget `onAnswer` makes confirm use the pre-answer draft** — `receipt-verify-sheet.tsx:L11`, `L28-L38`, `L107-L112`; `page.tsx:L231-L236`; `src/hooks/use-receipt-scan.ts:L142-L166`, `L169-L231` — **verified**
  - **Mechanism:** `onAnswer: (answers) => void`. `handleSubmit` calls it without awaiting, then on the last question calls `onClose() → confirmDraft()`. `answerQuestion` is `async`: it awaits `answerMutation` then `setDraft(prev => ...)`; React has not re-rendered when `confirmDraft` reads its `draft` closure, so it persists the pre-correction total/merchant.
  - **Trigger:** Answer the final question with a corrected total — because this is a Convex mutation round-trip, the race is deterministic on realistic latency.
  - **Fix:** Make `onAnswer` return `Promise<void>` and `await` it; have `confirmDraft` read from a ref mirroring the latest draft (or accept merged fields as an argument).

- **[P1-N3] Generic Save stays enabled during receipt review and takes a divergent, lossy path** — `src/app/quick-add/page.tsx:L186-L197`; `src/hooks/use-quick-add-state.ts:L400-L495` vs `L570-L590` — **verified**
  - **Mechanism:** Disable condition is `s.isExpense && s.entrySource === 'manual' && !s.verifiedSmsData`; a scan sets `entrySource = 'receipt'`, so the prominent Save button is enabled alongside the slip's own button. `handleSave` writes today's date (UTC), `detectedCategory`, drops tax/currency, and never calls `confirmDraft`.
  - **Fix:** Disable generic Save whenever `entrySource === 'receipt'`, or delegate it to `handleSaveScannedReceipt`.

- **[P2-N13] `answerQuestion`/`confirmDraft` swallow server errors and unconditionally destroy the draft** — `src/hooks/use-receipt-scan.ts:L160-L163`, `L204-L228`
  - **Mechanism:** `answerQuestion` catches into `setError` but resolves normally (so callers treat it as applied). `confirmDraft` writes the local expense first, catches confirm failure, and its `finally` always runs `setDraft(null)`.
  - **Trigger:** Confirm fails after the local add → draft handle lost, Convex draft stays `draft`, reappears later; pressing Save again writes a duplicate local expense.
  - **Fix:** Re-throw/return a success flag from `answerQuestion`; only clear the draft after both local add and server confirm succeed; route confirm failures into the offline queue or expose retry.

- **[P2-N12] Verification questions are untranslated English with raw field names; answers accepted without validation** — `convex/lib/receipt/questions.ts:L17-L67`; `receipt-verify-sheet.tsx:L86`, `L107-L123`
  - **Mechanism:** Prompts are `Confirm ${field}: ${value}` with field tokens `total/date/merchant/category/currency`; the sheet renders them verbatim for es/fr/de/pt/zh users. `inputType: 'date'` is set but the sheet hardcodes `type="text"`. `applyAnswers` stamps `conf: 1.0` even for empty/garbage values; `parseFloat(val) || val` leaves invalid strings intact at full confidence.
  - **Fix:** Move prompts to intl catalogs; render `type={currentQ.inputType === 'date' ? 'date' : 'text'}`; validate non-empty, positive finite total, `^\d{4}-\d{2}-\d{2}$` date before setting `conf: 1.0`.

- **[P2-N2] `syncOfflineDraft` ignores `confirmed`/`answers` on idempotent replay** — `convex/receipts/scrapeBot.ts:L205-L279` (early return `L219-L227`)
  - **Mechanism:** The `clientDraftId` short-circuit returns the existing draft before applying `answers`/`confirmed`; an offline draft flushed as `draft` then retried as `confirmed` returns `alreadySynced: true` and leaves the server row in `draft`.
  - **Fix:** On the existing path, patch `status: "confirmed"` (and apply answers/overrides) before returning; report `alreadySynced: false` when a mutation occurred.

- **[P1-C3], [P1-C5], [P2-C5], [P3-C4]** — carried scrapeBot field wipe / 150 ms decode abort / restore `DataError` + guardless storage / missing IDB `blocked`+`versionchange` handlers.

### Lens 8 — Type Systems, Schema & Contracts

- **[P1-C10] `ocr-worker.ts` 4-arg `createWorker` (OEM mismatch), `eng`-only CDN 404 for Thai, init race, stale logger closure** — carried
- **[P3-C2] Loose validators across mutations/routes** — carried; **augmented**: `share-target/route.ts:L13-L32` also casts `FormData.get()` to `string` — a multipart *file* part named `text` makes `text.trim()` throw a 500 (the unbounded `Location` redirect is the carried part of this finding).
  - **Fix:** `const raw = params.get('text') ?? params.get('url'); const text = typeof raw === 'string' ? raw.slice(0, 4096) : '';` and return 400 for invalid/oversized input.
- **[P3-N2] LINE Gemini prompt requests categories that `normalizeCategory` always collapses to `"other"`** — `convex/line.ts:L182-L195` vs `convex/receipts/constants.ts:L4-L15`
  - **Mechanism:** The prompt asks for `shopping, medical, personal, education, income`, none in `VALID_CATEGORIES`; `normalizeCategory("shopping") → "other"`. The parallel `scanActions.ts:162` prompt uses the correct list, so behaviour differs by ingest path.
  - **Fix:** Use the canonical exported list in the LINE prompt (or map labels explicitly).

### Lens 9 — Platform, Viewport & Portability

- Carried platform defects (150 ms mobile decode `[P1-C5]`, camera black frames/gesture-blocked picker `[P1-C6]`, 144 Hz drift + reduced-motion `[P2-4C]`, suspended Web Audio `[P3-C1]`) are documented in Lenses 3/4/5/7 and not double-counted.
- **New:** the UTC-date off-by-one `[P2-N9]` and untranslated verification prompts `[P2-N12]` above are the platform/ locale-facing additions.
- **Pass 2.5 (live geometry probe):** not triggered — no user-reported visual overlap or rendered-artefact complaint, and this is a static + test-execution audit. Static inspection of touch targets on receipt surfaces shows `min-h-[48px]` on primary controls; the previously noted `min-h-[36px]` line-item inputs in `scanned-receipt-card.tsx` remain a sub-44 px WCAG 2.5.8 concern. If visual complaints arise, run `canvas_geometry_probe.mjs --wcag` against a pristine baseline.

### Lens 10 — Cognitive Load & AI Maintainability

- Carried god-module bloat (`use-quick-add-state.ts` 868 LOC, `golden-splash.tsx` 701 LOC), two incompatible receipt preprocessors, and the dead-export/duplicate-name surface are scored under `[P1-N4]`.
- `dead_export_sweep.py` also flags `test_only_exports` such as route `POST`/`GET` handlers (false positives — framework conventions) and `GET` at `src/app/api/news/route.ts`; these are not counted as defects.
- **AI-maintainer drift note (carried):** `convex/receipts/ingest.test.ts:L90-L112` has a test titled `"rejects token signed with raw Bearer secret"` whose body asserts `200`, violating the repo's own comment-rot discipline (`AGENTS.md` §8).

---

## 3. Existing Test Suite Comparison & Mutation Truth Table

- **Test-to-Code File Ratio:** `196 / 340` (`0.58`; `171` unit+Convex files + `25` Playwright E2E specs). Live execution: **137/137 app files (784 passed) + 35/35 Convex files (240 passed) = 1,024 passing**; typecheck clean; lint 0 errors / 4 warnings.
- **Shipped-module proof:** `src/app/proxy.ts` remains unshipped (wrong directory); `convex/lib/receipt/boardShards.ts` has 0 production callers; `setAudioMuted`/`isMuted`/`playToggleClick` exist only in tests — all previously reported.
- **Estimated Mutation Kill Score ($M_{\text{kill}}$):** **`48.21%`** (`27/56` mutants, carried-forward basis: 2,792 assertions, 126/196 files with negative/boundary signals, 80/196 mock-using files, 5 unpaired critical modules). **Upper bound:** all 24 new defects survived the full green gate, so their paths are effectively 0% protected.

| Implementation Module | Critical Branches | Paired Test | Pathologies | Mutants | Missing Assertions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `receipt-verify-sheet.tsx` / `page.tsx` | `handleSubmit`, `handleCancelOrSkip`, `onClose` | `receipt-verify-sheet.test.tsx` (mock `onAnswer`) | Mock-Mirror, Stale-closure blind spot | `0/4` | Cancel/Skip writes no expense; final corrected total reaches saved amount |
| `use-receipt-scan.ts` | `answerQuestion`, `confirmDraft` | indirect | Async Failure blind spot | `1/4` | Await answer before confirm; keep draft on confirm failure |
| `sync-snapshots-store.ts` (`applyRemoteBoard`) | LWW compare, stamp | `snapshots-store.test.ts` | Result-Only, single-step | `1/4` | Local edit concurrent with remote apply survives; stamp inside data tx |
| `checkpoints-store.ts` | `restoreCheckpoint` | `checkpoints-store.test.ts` | Scale/Time-Window Myopia | `1/4` | Restored record keeps original `updatedAt`; partner edit not overwritten |
| `account-sync-mount.tsx` / `sync-snapshots.ts` | auto-restore, `gatherSnapshotData` | `sync-snapshots.test.ts` | Happy-Path, single-account | `1/4` | Two accounts → two cloud docs; auto-restore skips foreign accountId |
| `convex/line.ts` | `linkLineAccount`, webhook claim/release | `line.test.ts` | Threat-model blind spot, concurrency | `2/4` | Reject foreign `accountId`; duplicate + transient failure still processes once |
| `convex/accounts/accountInvites.ts` | cap/expiry, revoke | `accountInvites.test.ts` | Time-Window Myopia | `1/4` | >16 invite rows capped; removed user cannot redeem leftover token |
| `scanned-receipt-card.tsx` / `use-quick-add-state` | FX badge vs save | `page.test.tsx` | Result-Only | `1/4` | Saved amount equals converted amount; THB rate present |
| `src/lib/receipt/preprocess.ts` | canvas sizing | `preprocess.test.ts` | Canvas-Stub (0×0 passes) | `1/4` | Detached `img.naturalWidth` used; output width > 0 |
| carried modules (10) | — | — | — | ~`17/28` | See 2026-11-19 report §3 |

### Why Existing Tests Missed the New Defects

- **Verify-sheet races:** `receipt-verify-sheet.test.tsx` passes a static `onAnswer = vi.fn()`, so neither the async ordering nor the Cancel/Skip→`confirmDraft` aliasing is observable; no assertion checks `addExpense` call count.
- **Sync LWW holes:** tests assert final record values after a single apply, never a concurrent local write interleaved with the remote apply, and never inspect `localWrites` stamp values or transaction counts.
- **Cloud account blindness:** `sync-snapshots.test.ts` seeds one account; no test syncs two accounts and asserts two server docs or that auto-restore respects the active `accountId`.
- **LINE backend:** `line.test.ts` checks that a second user cannot hijack an *already-linked* LINE ID, but never tests a foreign `accountId`, and webhook tests exercise a single delivery, not the duplicate-delivery + transient-failure interleaving.
- **Invite lifecycle:** `accountInvites.test.ts` uses freshly inserted rows and <16 invite rows; no test advances time past 7 days at redeem, cycles >16 rows, or removes a member then redeems a leftover token.
- **FX/currency:** no test compares the displayed converted amount with the value passed to `addExpense`; THB is absent from every fixture.

### Minimal Viable Test Harness (MVTH)

1. **Tier 1 — Pure/State invariants (zero mocks):** table-driven `applyAnswers` validation `["", "0", "abc", "42.50", "tomorrow"]`; `toISODate` timezone cases; `preprocessImage` with detached `Image` asserting `width > 0`; FX rate table asserting a THB entry and `convertedAmount === savedAmount`.
2. **Tier 2 — Concurrency & lifecycle:** counting-IDB wrapper asserting `applyRemoteBoard` spans one `readwrite` tx and stamps inside it; concurrent local-edit-during-apply; checkpoint restore preserving original `updatedAt` and not overwriting a partner stamp; verify-sheet stateful wrapper asserting Cancel/Skip calls no `addExpense` and the final correction is the saved amount.
3. **Tier 3 — Backend contract boundaries (`convex-test`):** foreign `accountId` rejected; >16-row invite cap; removed member cannot redeem; webhook duplicate + transient failure processes exactly once; `syncOfflineDraft` confirmed replay patches status; live CSP header E2E asserting per-request `nonce-` and no `unsafe-inline`/`unsafe-eval` in `script-src`.

---

## 4. Surgical Refactoring Blueprints (Zero-Mutation Drafts)

### Refactor R1: Atomic LWW application in `applyRemoteBoard`

- **Target:** `src/lib/db/stores/snapshots-store.ts:L231-L272`
- **ROI:** Eliminates two silent local-edit-loss classes with one transaction; no behaviour change for normal syncs.

```ts
// Target: clock read, compare, write and stamp inside ONE readwrite tx.
const tx = db.transaction([...activeStores, 'localWrites'], 'readwrite');
const localStore = tx.objectStore('localWrites');
for (const item of stage) {
  const stamp = await localStore.get(`${item.store}:${item.explicitKey}`) as number | undefined;
  if (item.updatedAt <= (stamp ?? 0)) continue;
  const store = tx.objectStore(item.store);
  if (item.deleted || item.value === null) await store.delete(item.explicitKey as never);
  else await store.put(item.value as never);
  await localStore.put(item.updatedAt, `${item.store}:${item.explicitKey}`);
}
await tx.done; // no trailing recordLocalWritesBulk()
```

### Refactor R2: One-shot verify sheet (split finish from cancel)

- **Target:** `src/components/receipt/receipt-verify-sheet.tsx:L8-L43`; `src/app/quick-add/page.tsx:L231-L236`
- **ROI:** Closes three P1s (unwanted save, lost final answer, no-write cancel) with one prop split.

```tsx
type Props = {
  onAnswer: (answers: Record<string, string>) => Promise<void>;
  onFinish: () => void;   // all questions answered, last answer awaited
  onCancel: () => void;   // no write, clears draft only
};
async function handleSubmit(val: string) {
  if (!currentQ) return;
  await onAnswer({ [currentQ.field]: val });   // await the mutation
  if (currentIndex + 1 < questions.length) { setCurrentIndex(i => i + 1); setInputValue(''); }
  else onFinish();
}
```

### Refactor R3: Account-scoped cloud snapshots

- **Target:** `convex/snapshots.ts:L45-L125`; `src/lib/convex/sync-snapshots.ts:L87-L169`, `L454-L466`; `account-sync-mount.tsx:L94-L130`
- **ROI:** Stops cross-board backup destruction and wrong-board auto-restore.

```ts
// schema: .index("by_user_account_date", ["userId", "accountId", "date"])
// getLatestSnapshot: add accountId arg; .withIndex(...).eq("userId", userId).eq("accountId", accountId)
// AccountSyncMount: if (latestSnapshot.accountId !== (await getCurrentAccountId() ?? 'personal')) return;
// restoreFromCloudSnapshot: setCurrentAccountId only when force === true
```

### Refactor R4: Idempotent webhook state machine

- **Target:** `convex/line.ts:L50-L89`, `L401-L476`
- **ROI:** Eliminates silent receipt loss under duplicate delivery + transient failure.

```ts
// processedWebhooks: { webhookEventId, status: "processing"|"done"|"failed", ownerId, attempts, nextRetryAt }
// claim returns { claimed: boolean, ownerId }
// duplicate that loses: continue (owner will retry)
// owner on failure: markWebhookEventFailed(ownerId) + scheduler.runAfter(backoff, retry)
// only status === "done" is final; TTL cleanup deletes done/failed rows
```

---

## 5. Phased Execution Roadmap & Scoped Agent Prompts

1. **Phase 1 — Containment & Safety Lock (`P0` + receipt-save `P1`s):** move nonce proxy and strip `'unsafe-inline'/'unsafe-eval'` `[P0-C1]`; fix sync-queue superseded-row deletion `[P0-C2]`; enforce invite expiry `[P0-C3]`; add LINE link verification `[P0-C4]` **and** `accountId` ownership validation `[P1-N9]`; split verify-sheet finish/cancel and await the final answer `[P1-N1,N2]`; disable the divergent generic Save `[P1-N3]`; persist FX-converted amount `[P1-N4]`.
2. **Phase 2 — Sync integrity, backend trust & data integrity (`P1`s):** atomic `applyRemoteBoard` `[P1-N5]` and checkpoint restore `[P1-N6]`; account-scoped snapshots `[P1-N7]`; webhook state machine `[P1-N8]`; invite cap index + revoke-on-removal `[P1-N10,N11]`; then the 10 carried P1s (pagination, purge, scrapeBot, OCR, camera, image decode, React keys, Gemini key/`alreadySynced`).
3. **Phase 3 — Structural de-vibing (`P2`/`P3`):** queue erasure, cache scope, income/net-worth atomicity, lock rotation, throttled push, UTC dates, decimal inputs, intrinsic image sizing, question validation/i18n, then carried god-module/dead-export/lifecycle debt.

### Copy-Paste Surgical Prompts

> **Prompt [P1-N1+N2] (`receipt-verify-sheet.tsx`, `quick-add/page.tsx`, `use-receipt-scan.ts`):** "Scope edits to these three files. Make `onAnswer` return `Promise<void>` and await it in `handleSubmit` before advancing/closing. Replace the single `onClose` with `onFinish` (successful completion → `confirmDraft`) and `onCancel` (new no-write `cancelDraft` in `use-receipt-scan`). Make `confirmDraft` read the latest draft from a ref so an in-flight answer can't be shadowed. Add tests asserting Cancel/Skip never call `addExpense` and that a corrected final total is the saved amount. Run `npm test`."

> **Prompt [P1-N5] (`snapshots-store.ts`):** "Scope edits to `src/lib/db/stores/snapshots-store.ts:231-272`. Move the `localWrites` clock read inside the `readwrite` transaction that applies remote records, write each applied stamp into `localWrites` before `await tx.done`, and delete the trailing `recordLocalWritesBulk()` call. Add a test with a counting IDB stub asserting one transaction and a concurrent local edit surviving. Run `npm test`."

> **Prompt [P1-N9+N10+N11] (`convex/line.ts`, `convex/accounts/accountInvites.ts`):** "Scope edits to `convex/line.ts:126-165` and `convex/accounts/accountInvites.ts:83-138`, `313-410`. Validate `linkLineAccount`'s optional `accountId` against `accounts.by_accountId` requiring owner/member rights. Add a `by_board_and_status` index query for the invite cap/expiry sweep. On `removeMember`/`leaveAccount`, cancel pending invites for the departing user and implement `boardEpoch` rotation so leftover tokens cannot re-admit them. Add `convex-test` regressions and run `npm run test:convex`."

> **Prompt [P1-N8] (`convex/line.ts`):** "Scope edits to `convex/line.ts:50-89`, `401-476`. Replace delete-on-failure idempotency with a `processing|done|failed` state machine keyed by `webhookEventId`, with owner-scoped release and scheduled bounded retries. Add a test with delivery A claiming + failing content fetch while delivery B loses the race, asserting the receipt is eventually processed exactly once. Run `npm run test:convex`."

> **Prompt [P2-N4+N5+N6+N7] (client lifecycle):** "Scope edits to `src/hooks/use-shared-board.ts:175-205`, `public/sw.js:121-135`, `src/lib/db/stores/incomes-store.ts:6-27`, `src/hooks/use-local-db.ts:507-560`. Gate `flushQueue` on `boardId` at the top so an unlink can't wipe the queue; scope SW cache deletion to `bb-*`; switch income mutations to atomic `putWithStamp`; re-read the net-worth snapshot inside each mutation before assembling. Add targeted tests and run `npm test`."

---

## 6. Verification & Zero-Mutation Proof

| Check | Result |
| :--- | :--- |
| `git rev-parse HEAD` (before / after) | `2047ce5b793e9e2ef8544fa59c232ab3b192c533` / identical |
| `git status --porcelain` (before / after) | `?? docs/audits/budgetboss-surgical-audit-2026-11-19.md` / identical (pre-existing untracked file) |
| `tree_integrity_sha256` (before / after) | `13f760a8a34f768d019aa7d6de19c084a643539e25e1e5cc8e09c0f71f105af2` / identical at Pass-5 verification; after report creation the all-files digest changes only because the scanner hashes every file. Recomputing with **only** this new report excluded reproduces `13f760a8…` byte-for-byte, proving zero source/config/test mutation. |
| `npm run typecheck` | pass (0 errors) |
| `npm run lint` | pass (0 errors, 4 `no-explicit-any` warnings in test files) |
| `npm test` | 137 files / 784 tests passed |
| `npm run test:convex` | 35 files / 240 tests passed |

**Pass-4 score recomputation command:** `python3 -B <skill>/scripts/score_audit.py --loc 38778 --p0 4 --p1 21 --p2 19 --p3 7 --killed 27 --evaluated 56` → `S_health = 43`, `CRITICAL`.

*Report generated 2026-11-23. No repository source, config, or test file was created, edited, or deleted during Passes 1–5; this report is the only new file.*
