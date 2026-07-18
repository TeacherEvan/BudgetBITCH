# Shared Couple Boards — Implementation Plan

**Date:** 2026-07-19
**Design:** docs/plans/2026-07-19-shared-couple-boards-design.md (approved)
**Workflow:** TDD per task (write failing test → implement → green → commit). Subagent-driven.

## Tasks

### T1 — Schema: `userProfiles` + `sharedBoards`
- **File:** `convex/schema.ts`
- Add `userProfiles` (userId, shareCode, displayName?, linkedBoardId?) with indexes `by_user`, `by_shareCode`.
- Add `sharedBoards` (boardId, memberA, memberB, data: v.any(), updatedAt, updatedBy) with index `by_boardId`.
- **Test (convex-test):** schema builds; shareCode index unique-enforced shape; round-trip insert/get.
- **Verify:** `npx convex dev` dry (or convex-test load). `npm run build` still green.

### T2 — Local board serialize/replace + change events
- **File:** `src/lib/db/local-db.ts` (+ `src/lib/db/local-db.test.ts`)
- Add `serializeBoard(): Promise<BoardSnapshot>` (reads 8 shared stores).
- Add `replaceBoardData(board: BoardSnapshot): Promise<void>` (clear+reinsert the 8 stores; does NOT dispatch the change event).
- In every mutating fn for the 8 shared stores (saveWizardProfile, add/update/deleteExpense, saveBudgetCategory, add/update/deleteBill, add/update/deleteSavingsGoal, saveNetWorthSnapshot, add/update/deleteDebt, save/deleteCriticalExpenseCommitment), dispatch a `CustomEvent('budgetbitch:localBoardChanged')` on `window` (SSR-guarded).
- **Test:** round-trip serialize→replace; replace does not emit event; a mutating fn emits event (jsdom env with fake-indexeddb or the existing proxy — use `idb` against fake-indexeddb in test).
- **Verify:** `npm run test` green (new file).

### T3 — Convex functions: profile, link, push, get, unlink
- **File:** `convex/sharedBoards.ts` (+ `convex/sharedBoards.test.ts`, convex-test)
- `getMyProfile` query — returns caller `userProfiles` (creates row w/ shareCode if missing).
- `resolveShareCode` query — `{ code }` → `{ exists, displayName? }`.
- `linkByCode` mutation — resolve partner; reuse existing `linkedBoardId` board if present else create; set both profiles; return boardId; reject self-link (code === own).
- `getBoard` query — `{ boardId }`; caller must be memberA/memberB else throw; return doc.
- `pushBoard` mutation — `{ boardId, data, updatedAt }`; authz member; LWW patch only if `updatedAt > doc.updatedAt`.
- `unlink` mutation — clear caller `linkedBoardId`; if board <2 members delete doc.
- All auth via `getAuthUserId(ctx)`. shareCode collision: retry generate on unique index violation.
- **Test:** getMyProfile creates shareCode; linkByCode sets both + returns boardId; self-link throws; pushBoard LWW rejects stale; getBoard rejects non-member; unlink clears + deletes orphan board.
- **Verify:** `npm run test` green.

### T4 — `useSharedBoard` hook
- **File:** `src/hooks/use-shared-board.ts` (+ `src/hooks/use-shared-board.test.tsx`)
- State: `myProfile`, `partnerName`, `isLinked`, `boardId`, `lastSyncedAt`.
- On `isLinked`: `useQuery(api.sharedBoards.getBoard, { boardId })`.
  - **Pull:** when `doc.updatedAt > lastAppliedAt` → `replaceBoardData(doc.data)`; set `lastAppliedAt` + `lastSyncedAt`; NO push (guard flag).
  - **Push:** `window` listener for `budgetbitch:localBoardChanged`, debounced 800ms → `serializeBoard()` → `mutation(api.sharedBoards.pushBoard, { boardId, data, updatedAt: Date.now() })`. On push success set `lastSyncedAt`.
  - **Offline:** on push error / `!navigator.onLine`, stash `{ data, updatedAt }` in `localStorage['budgetbitch:boardQueue']`; `online` event flushes (mirror `sync-snapshots.ts`).
- Returns `{ myProfile, partnerName, isLinked, boardId, linkByCode(code), unlink(), lastSyncedAt }`.
- **Test (jsdom + mocked convex api):** pulls when remote updatedAt newer; debounces 2 rapid local edits into 1 push; offline queue flushes on `online` event.
- **Verify:** `npm run test` green.

### T5 — Mount hook app-wide
- **File:** `src/app/layout.tsx`
- Render `<SharedBoardSync />` (a component calling `useSharedBoard()`) inside `ConvexClientProvider`. It renders nothing (sync side-effect only), so no layout change.
- **Verify:** `npm run build` green; no visual regression.

### T6 — Settings UI: Shared Board section
- **File:** `src/app/settings/page.tsx` (+ `src/app/settings/page.test.tsx`)
- New section "Shared Board / แดชบอร์ดคู่":
  - Show own share code + Copy button (`getMyProfile`).
  - Not linked: input partner code + Link (validate via `resolveShareCode` → `linkByCode`); inline errors (invalid / self / already linked).
  - Linked: "Linked with {partnerName}" + Unlink + last-synced.
- TH + EN labels in `labels`.
- **Test:** renders share code; link flow calls resolve+link; unlink calls unlink; error states.
- **Verify:** `npm run test` + `npm run build` green.

### T7 — Final verification
- `npm run lint`, `npm run test`, `npm run build` all green.
- `npx convex dev` to push schema to dev deployment (if CONVEX_URL live).
- Commit all; no push (user merges).

## Confirmation command per task
`npm run test` (vitest run) + `npm run build` for UI/mount tasks.

## Notes
- convex-test env: add `environment: "edge-runtime"` test config for convex/*.test.ts (per AGENTS.md guidelines), or co-locate with a separate vitest config. Reuse existing `vitest.config.ts` jsdom for hook/db tests; convex tests need edge-runtime — use a `convex/vitest.config.ts` if separate env required. Check at T1/T3.
- fake-indexeddb for local-db tests (add dev dep if missing).
