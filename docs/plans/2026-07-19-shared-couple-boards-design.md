# Shared Couple Boards — Design

**Date:** 2026-07-19
**Scope:** Let two BudgetBITCH users connect by a share code and co-edit ONE shared
dashboard. Changes from either device propagate to the other via Convex (last-write-wins).
Local IndexedDB stays the runtime store; Convex holds the shared board doc.

## Decisions (locked via clarifying questions)
1. **Shared single board** — both linked users edit the SAME dataset (true 2-way).
2. **Share-code link** — each user has a unique share code (their "user id"); one pastes the
   other's code in Settings → instant link, no accept step.
3. **Local-first + Convex shared doc** — keep IndexedDB; add a `sharedBoards` Convex doc holding
   the whole board; push full board on local edit (LWW by `updatedAt`); subscribe to pull partner edits.

## Data model

### Convex schema additions (`convex/schema.ts`)
```ts
userProfiles: defineTable({
  userId: v.id("users"),        // owner of this profile (auth user)
  shareCode: v.string(),        // unique public code users connect by
  displayName: v.optional(v.string()),
  linkedBoardId: v.optional(v.string()),
}).index("by_user", ["userId"]).index("by_shareCode", ["shareCode"]),

sharedBoards: defineTable({
  boardId: v.string(),          // stable id, also doc _id convenience
  memberA: v.id("users"),
  memberB: v.id("users"),
  data: v.any(),                // BoardSnapshot (serialized local board)
  updatedAt: v.number(),        // LWW timestamp (ms)
  updatedBy: v.id("users"),
}).index("by_boardId", ["boardId"]),
```

`shareCode` is generated once per user (e.g. `crypto.randomUUID().slice(0,8).toUpperCase()`),
retried on collision against the unique `by_shareCode` index.

### BoardSnapshot (serialized local board)
```ts
type BoardSnapshot = {
  wizardProfile: WizardProfile | null;
  expenses: ExpenseEntry[];
  budgets: BudgetCategory[];
  bills: Bill[];
  savingsGoals: SavingsGoal[];
  netWorthSnapshots: NetWorthSnapshot[];
  debts: Debt[];
  criticalExpenseCommitments: CriticalExpenseCommitment[];
};
```
NOT shared (user-local prefs): `settings`, `newsCache`, `locationCache`.

## Convex functions (`convex/sharedBoards.ts`)
- `ensureProfile` (internalMutation): create `userProfiles` row w/ shareCode if absent. Called from queries.
- `getMyProfile` (query): returns caller's `userProfiles` (shareCode, displayName, linkedBoardId).
- `resolveShareCode` (query, args: `{ code }`): returns `{ exists, displayName }` so UI can validate before linking.
- `linkByCode` (mutation, args: `{ code }`): resolve partner by `by_shareCode`; if either party already has
  `linkedBoardId`, reuse that board (re-link) else create `sharedBoards` with `memberA`/`memberB`; set both
  `linkedBoardId`. Return `boardId`. Re-link is single-board only (1:1 couple).
- `unlink` (mutation): clear `linkedBoardId` for caller; if board now has <2 members, delete board doc.
- `getBoard` (query, args: `{ boardId }`): authz — caller must be memberA/memberB; return board doc.
- `pushBoard` (mutation, args: `{ boardId, data, updatedAt }`): authz member; LWW — `if (updatedAt > doc.updatedAt) patch`.

All auth via `getAuthUserId(ctx)` — never accept a userId arg.

## Client layer
- `src/lib/db/local-db.ts` additions:
  - `serializeBoard(): Promise<BoardSnapshot>` — read the 8 shared stores.
  - `replaceBoardData(board)` — clear+reinsert the 8 stores (bulk overwrite). Does NOT emit change events (so applying a remote board never triggers a push).
  - `emitBoardChanged()` — called by every existing mutating fn (add/update/delete/save for the 8 shared stores) so the sync layer can react to genuine local edits.
- `src/hooks/use-shared-board.ts` (`useSharedBoard()`):
  - On mount (when linked): `useQuery(api.sharedBoards.getBoard, { boardId })`.
  - **Pull:** when remote `updatedAt > lastAppliedAt` → `replaceBoardData(remote.data)`, set `lastAppliedAt`. (No push.)
  - **Push:** subscribe to `budgetbitch:localBoardChanged` (debounced ~800ms) → `serializeBoard()` → `pushBoard({ boardId, data, updatedAt: Date.now() })`. Incoming `updatedAt` equals local; server ignores if not greater → no echo.
  - Offline: if push throws/offline, stash `{ data, updatedAt }` in `localStorage['budgetbitch:boardQueue']`; flush on `online` event (same pattern as `sync-snapshots.ts`).
  - Returns `{ myProfile, partnerName, isLinked, boardId, linkByCode(code), unlink(), lastSyncedAt }`.
- Mount `useSharedBoard()` once app-wide (in the `(app)` layout) so push/pull runs whenever linked,
  independent of which page the user is on.

## Settings UI (`src/app/settings/page.tsx`)
New "Shared Board" (EN) / "แดชบอร์ดคู่" (TH) section:
- Show **own share code** + Copy button.
- If not linked: input for partner's code + "Link" (links via `resolveShareCode` validate → `linkByCode`).
- If linked: show "Linked with {partnerName}" + "Unlink" + last-synced timestamp.
- Errors (invalid code / already linked / self-link) surfaced inline.

## Tests (vitest, jsdom)
1. `local-db`: `serializeBoard`/`replaceBoardData` round-trip; `replaceBoardData` does not emit change event; mutating fns emit event.
2. `convex/sharedBoards` (convex-test): `linkByCode` creates board + sets both profiles; `pushBoard` LWW rejects stale `updatedAt`; `getBoard` rejects non-member; `unlink` clears + deletes orphan board; duplicate shareCode collision handled.
3. `use-shared-board`: pulls remote when `updatedAt` newer; debounces local edits into one push; offline queue flushes on reconnect.

## Out of scope (YAGNI)
- >2 members / groups. Single 1:1 couple board.
- Conflict-free merge (CRDT). LWW is what was requested.
- Sharing partial panels. Whole board only.
- Real-time presence/cursors.

## Rollout
- Backward compatible: unlinked users never touch `sharedBoards`; existing sync path unchanged.
- Requires Convex deploy (`npx convex dev`) to apply schema. Local dev uses `NEXT_PUBLIC_CONVEX_URL`.
