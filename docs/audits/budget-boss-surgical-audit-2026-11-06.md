# Surgical Audit Report: Budget Boss (basic security + architecture pass)

| Audit Metadata | Specification |
| :--- | :--- |
| **Audit Date** | 2026-11-06 |
| **Scope** | Whole repo; 519 files, 55,650 effective LOC (includes vendored `public/tesseract/*`, i18n catalogs). Deep read limited to Convex trust boundaries (`convex/line.ts`, `convex/http.ts`, `convex/receipts/{ingest,scanActions,draftCrud}.ts`). |
| **Stack** | Next.js 16 App Router, Convex + Convex Auth, IndexedDB, PWA |
| **Pre/Post state** | HEAD `5be9d3a`, clean tree before and after. Scanner digest `aa368ee22bea109e` (patched scanner, scratch copy). |
| **Health Score** | **~89 / 100** (D_raw=26, P_test=7.5, M_kill ASSUMED 50% — not measured) |
| **Risk Level** | **LOW** by formula. The formula saturates on a 55k-LOC repo; see P1s. |

> [!NOTE]
> This is a **basic** audit. Only 5 files were read in depth. Lenses 2, 3, 5, 9 and Pass 2.5/3 (mutation testing, runtime probe) were NOT performed.

## 1. Triage

| Tier | Count | Findings |
| :--- | :--- | :--- |
| P0 | 0 | none found in files read |
| P1 | 2 | S1 LINE link takeover; S2 unverified `accountId` |
| P2 | 3 | A1 god files; A2 client-only route protection; A3 no rate/size limit on `parseReceipt` |
| P3 | 1 | Q1 token comparison/hex parsing style |

Hotspots (scanner): `src/lib/db/local-db.ts`, `src/hooks/use-quick-add-state.ts`, `src/components/launch/golden-splash.tsx`, `src/hooks/use-local-db.ts`, `src/components/dashboard/dashboard-shell.tsx`, `src/components/settings/data-backup-card.tsx`, `src/hooks/use-accounts.ts`, `convex/accounts/accountCrud.ts` (all >400 LOC). Also `WelcomeWindow-startup/WelcomeScreen.tsx` sits outside `src/` (stray tree?).

## 2. Findings

### Lens 6 — Security
- **[P1-S1] Any signed-in user can claim any LINE user ID** — `convex/line.ts:55-91`
  - Root cause: `linkLineAccount` takes `lineUserId` from the client and upserts `lineUsers` with no proof the caller owns that LINE identity (no one-time code / LINE login). Existing mapping is overwritten (`patch`, L72-78).
  - Trigger: attacker who learns a victim's LINE userId (`U` + 32 hex; leaks via screenshots/logs) calls the mutation; the victim's subsequent bot receipts are ingested into the attacker's account (`ingest.ts:L127-138`), and the victim is silently unlinked.
  - Fix: issue a short-lived random link code from an authed mutation; the webhook (HMAC-verified) consumes the code and writes the mapping with the `lineUserId` taken from the signed event. Remove client-supplied `lineUserId` writes. Never overwrite an existing mapping owned by another user.
- **[P1-S2] `accountId` not checked against membership** — `convex/receipts/scanActions.ts:~110-125,223`, `convex/line.ts:57-58`
  - Root cause: `accountId` (a `v.string()`, not `v.id`) is accepted from the client and persisted on receipts / mapping without verifying the caller belongs to that board.
  - Trigger: user passes another board's id; receipts get written tagged to it, visible to that board's members (injection) — confirm in `sharedBoards`/accounts queries.
  - Fix: use `v.id("accounts")` (or the actual table) and check membership via the existing accounts membership helper before write.
- Positive: `/receipts/ingest` uses Bearer + HMAC app token with 5-min window; `/line/webhook` is HMAC-verified; `userId` derived from `getAuthUserId`; no secrets committed (only `.env.example` tracked); only `dangerouslySetInnerHTML` is static JSON.stringify of speculation rules (`src/app/layout.tsx:88`, safe).

### Lens 7/8 — Reliability, contracts
- **[P2-A3] `parseReceipt` has no size/rate cap** — `convex/receipts/scanActions.ts:110-135`. A signed-in user can send arbitrarily large base64 and burn the Gemini quota. Fix: cap `base64Image.length`, restrict MIME allowlist, per-user rate limit.
- **[P3-Q1]** `ingest.ts:L16-37` `Buffer.from(hmac,"hex")` silently truncates bad hex; `crypto.subtle.verify` is constant-time, so low risk. Validate `/^[0-9a-f]{64}$/` first. Bearer compare is hand-rolled constant-time (length leak only; acceptable).

### Lens 1/10 — Architecture
- **[P2-A1] God files** (above). `local-db.ts` mixes schema, upgrade, and store plumbing; hook files `use-quick-add-state.ts`, `use-local-db.ts`, `use-accounts.ts` are large state aggregates — candidates for explicit state-machine/reducer extraction.
- **[P2-A2] Route protection is client-side only** (no middleware/proxy). Acceptable because data lives behind Convex auth, but any server-rendered content on protected prefixes is publicly fetchable. Confirm those pages hold no user data server-side.
- Layering matches AGENTS.md (domain in `src/modules`, Convex guards). Note `convex/receipts/ingest.ts` uses `internal.receipts.*` — keep `check:convex-imports` in CI.

### Lenses not covered
2, 3, 4, 5, 9: **NOT AUDITED** (basic scope).

## 3. Tests
Not mutation-tested. Convex has paired tests for `line`, `receipts`, `accounts`, `sharedBoards`, etc. Gap to check first: no test asserts that linking an already-claimed `lineUserId` by a different user fails (S1) or that foreign `accountId` is rejected (S2) — likely why they exist.

## 4. Next steps / prompts
> **P1-S1:** "Scope edits to `convex/line.ts` and `convex/line.test.ts`. Replace client-supplied `lineUserId` in `linkLineAccount` with a one-time link-code flow; webhook consumes the code. Add tests: second user cannot take an existing mapping; expired code rejected. Run `npm run test:convex`."
>
> **P1-S2:** "Scope edits to `convex/receipts/scanActions.ts`, `convex/line.ts`, tests. Validate `accountId` membership for the caller before persisting. Add negative tests."
