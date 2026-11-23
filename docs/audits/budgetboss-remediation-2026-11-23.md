# Remediation Report — 2026-11-23 Surgical Audit

| Metadata | Specification |
| :--- | :--- |
| **Date** | 2026-11-23 |
| **Base** | `38e6c79` (audit report commit) |
| **Integration HEAD** | `651a9dd` on `fix/audit-2026-11-23` |
| **Strategy** | 9 disjoint workstreams, isolated worktrees, max 2 concurrent implementers, TDD (failing test first), one scoped merge commit per workstream, controller review between merges |
| **Findings addressed** | All P0 (4), P1 (21), P2 (19) and P3 (7) from the 2026-11-23 audit, plus carried findings from the 2026-11-19 audit that the newer report summarized rather than detailed |
| **Final gate** | `npm run ci` — `CI_EXIT=0`, all 9 locally-runnable gates passed in 171.75s (3 CI-only gates skipped) |

## 1. Execution summary

| WS | Branch / commit | Scope | Evidence at merge |
| :--- | :--- | :--- | :--- |
| W1 | `fix/audit-w1-receipt` · `2497673` | Receipt review & save: cancel/skip no-write, last-answer await + ref, disable divergent Save, persist FX conversion + THB, local-calendar dates, Tier1/2 server drafts + scan generation guard | 797 unit tests |
| W2 | `fix/audit-w2-sync` · `371d288` | Atomic LWW apply, checkpoint stamps, account-blind auto-restore, queue erasure, income/net-worth atomicity, local lock hardening, SW cache scope + abort | 831 unit + 253 Convex |
| W3 | `fix/audit-w3-convex-auth` · `6f50ac3` | Invite 7-day TTL + no token burn, LINE link challenge, `accountId` ownership, invite cap sweep, revoke-on-removal, LINE category vocabulary | 253 Convex |
| W4 | `fix/audit-w4-convex-receipts` · `e094aeb` | Indexed receipt pagination + `_id` dedupe, scrapeBot field preservation/confirm, purge write budgets, account-scoped snapshots, Gemini key header, `alreadySynced`, boardMerge deep equality | 268 Convex + 797 unit |
| W5 | `fix/audit-w5-platform` · `f4f4884` | Nonce CSP activated at `src/proxy.ts`, static unsafe CSP removed, CSP guard mutation-tested, telemetry/share-target bounds, deps reclassified | Live nonce observed, 836 unit |
| W6 | `fix/audit-w6-craft` · `70b38c3` | 10 s decode, camera readiness + library fallback, 3-arg `createWorker`, multi-lang CDN, intrinsic image size, decimal line items, splash a11y, audio resume | 846 unit |
| W7 | `fix/audit-w7-line-integration` · `8e06f1b` | Bot-callable `/api/line/link-challenge`, manual code entry UI, runtime break from W3 restored | 273 Convex + 845 unit |
| W8 | `fix/audit-w8-residuals` · `bd57978` | Gemini key removed from `line.ts` URL, account-scoped snapshot list in diagnostics, strict `v.id("users")` validator | 278 Convex + 847 unit |
| W9 | `fix/audit-w9-carried` · `ff5ada9` | Stable line-item keys + raw decimal drafts, single-flight board swap + pointer recheck + stash preservation, preview blob revoke, stale docs | 868 unit + 278 Convex |

Every workstream wrote its regression tests first and observed them fail before the production edit. Detailed red/green evidence and per-task reports are in `/tmp/opencode/remediation/w{,1,2,3,4,5,6,7,8,9}-report.md`.

A controller coverage audit after W8 caught three originally-audited findings that had not been assigned to any workstream (mutable line-item keys, non-atomic board swap, preview object-URL lifecycle); W9 was dispatched specifically to close them.

## 2. Final verification

Authoritative gate re-run after the **final** merge:

```
✅ Passed 1/12 Linting (ESLint) (12.35s)
✅ Passed 2/12 Type Checking (tsc) (4.98s)
✅ Passed 3/12 IndexedDB Schema Guard (0.05s)
✅ Passed 4/12 CSP / Source-host Drift Guard (0.10s)
⏭️  Skipping 5/12 Convex Import Resolution Guard (CI-only gate)
✅ Passed 6/12 Unit & Component Tests (Vitest) — 144 files / 868 tests (123.56s)
✅ Passed 7/12 Convex Backend Tests — 38 files / 278 tests (11.32s)
✅ Passed 8/12 Production Build (Next.js) (19.29s)
⏭️  Skipping 9/12 Bundle Budget Guard (CI-only gate)
⏭️  Skipping 10/12 Security Audit (npm audit) (CI-only gate)
✅ Passed 11/12 Stale Bug-comment Guard — 244 test files (0.10s)
⏭️  Skipping 12/12 Deploy Guard (Convex URL check) (CI-only gate)
🎉 ALL QUALITY GATES PASSED CLEANLY in 171.75s  (CI_EXIT=0)
```

Earlier intermediate gates: W1+W3 → 797 unit tests; W1–W7+W6 → 860 unit tests; W8 → 847 unit + 278 Convex; W9 → 868 unit + 278 Convex. Typecheck was clean at every merge. W5 additionally observed a live per-request CSP nonce with no `unsafe-inline` via a local dev server, and mutation-tested the CSP guard against both `unsafe-inline` and production `unsafe-eval`.

## 3. Residual risks and intentional deferrals

| Item | Status | Detail |
| :--- | :--- | :--- |
| **LINE bot challenge delivery** | **External deployment required** | In-repo Convex endpoint + app UI are complete and tested. The HF Space `EvilEvan/TeacherBOY` is healthy but still on its 2026-10-22 image (`80d1124`) with no challenge code. Users cannot obtain a link code until the bot is updated and redeployed. See §4. |
| **Board swap atomicity** | Partially deferred | W9 added a single-flight mutex and post-await pointer re-verification, closing the interleaving race. Collapsing the ~8 IDB transactions into one atomic multi-store swap requires `src/lib/db/local-db.ts` (outside W9 scope); the exact `swapBoardAtomically()` design is documented in `accountStorage.ts`. A crash inside the remaining multi-transaction window can still leave a mixed board state. |
| **`listReceipts` bounded scan** | Accepted residual | Replaced the O(N²) loop (10,500 reads) with one bounded `by_user_parsedAt` scan (≤1,000 reads) plus in-memory source/status filtering and `_id` dedupe. A composite `by_user_source_status_parsedAt` index would remove the 1,000-row ceiling; not required for correctness at tested scale. |
| **Structural debt (P2-C6)** | Deferred | God modules (`use-quick-add-state.ts` ~868 LOC, `golden-splash.tsx` ~701 LOC), two receipt preprocessors, ~92 dead value exports, duplicate split-brain names and the 31 MB archived HTML were catalogued in the audit but not refactored — maintainability debt, not a runtime defect. |
| **Minor validator hygiene (P3-C2 partial)** | Deferred | W5 fixed `share-target` and W8 fixed `removeMember`'s `v.id("users")`. Remaining lower-priority items (`acceptInvite`/`declineInvite` id validators, `setDisplayName` length cap, LINE image byte cap, `amount <= 0` in the drafts list) were not re-scoped. |
| **Mute UI wiring (P3-C1)** | Documented integration point | W6 exposed canonical `setSoundMuted()` / `isMuted()`; no settings control was added because the preferences card is outside W6 scope. |
| **jsdom decode fallback** | Test-only | A 150 ms decode path remains for jsdom so existing scan tests do not stall; real browsers use the 10 s deadline (regression test exercises it with a browser UA). |

## 4. External deployment steps (release gates)

1. Set the shared secret on the Convex production deployment (`steady-ox-280`):
   `npx convex env set LINE_BOT_LINK_SECRET <secret>`
2. Deploy the Convex backend so `POST https://steady-ox-280.convex.cloud/api/line/link-challenge` exists:
   `npx convex deploy`
3. Update `EvilEvan/TeacherBOY` to POST to that endpoint with header `x-bot-secret: <secret>` and body `{"lineUserId":"<event.source.userId>"}`, then send the returned 10-minute single-use `code` to the user in chat.
4. Store the same `LINE_BOT_LINK_SECRET` in the HF Space secrets and push to the Space's `hf/main` branch to rebuild.

Until steps 1–4 are complete, LINE account linking is unavailable by design (W3 correctly rejects unverified claims).

## 5. Worktree cleanup

All 9 worker branches were merged with `--no-ff` into `fix/audit-2026-11-23`. Worker worktrees can be removed with `git worktree remove <path>`; the integration branch is the deliverable.

## 6. Deployment runbook execution (same day)

The release steps in §4 were executed where credentials allowed:

| Step | Outcome |
| :--- | :--- |
| Generate `LINE_BOT_LINK_SECRET`, set on Convex **prod `steady-ox-280`** | Done. Secret also set on HF Space; values verified identical by hash. |
| `npx convex deploy` to prod | Code push succeeded (`✔ Deployed Convex functions`) after fixing the Convex typecheck config (see below). |
| Update `EvilEvan/TeacherBOY` with `/link` command + bot-authenticated challenge issuer | Done — `34a8f26` on the bot repo, pushed to Space `hf/main`. 1,049 bot tests pass, Ruff clean. `/link` is private-chat only: group/room requests are refused so the single-use code cannot be redeemed by another member. |
| Set Space secrets | `LINE_BOT_LINK_SECRET` set as a Space secret. `BUDGETBOSS_CONVEX_URL` already existed as a Space **variable** with the correct `.convex.site` value; a duplicate secret caused a `CONFIG_ERROR` collision and was removed. |
| Space rebuild | Triggered by the `hf/main` push; verified on the Space API. |

### Blocking external issue: Convex prod is runtime-disabled

The Convex CLI reported `Your projects are disabled because the team exceeded Free plan limits.` After the deploy, every HTTP action on `https://steady-ox-280.convex.site` (including unknown routes) returns HTTP 500, and `npx convex run` returns the same free-plan-limit error. The code is deployed; **functions cannot execute until the Convex account is upgraded or usage is reduced** (support@convex.dev). This is outside the repository and blocks live LINE linking and receipt ingest. No paid plan change was made without consent.

### Verification additions made during deployment

- `convex/tsconfig.json` now includes `vitest/globals` in `types` — Convex's deploy-time typecheck previously failed on the 38 `convex/**/*.test.ts` files. `npx tsc -p convex/tsconfig.json` is now clean; typecheck was **not** skipped for the deploy.
- `convex/_generated/api.d.ts` regenerated (4 previously missing modules).
- E2E: the project's CI gate runs Chromium only (`--project=chromium`); locally, Chromium is green. Two WebKit-only failures remain (splash-click timing and service-worker access-control page errors) — WebKit is explicitly excluded as flaky in `.github/workflows/ci.yml`. Local E2E requires a syntactically valid `NEXT_PUBLIC_CONVEX_URL`; the in-code `placeholder.convex.cloud` default throws on Convex client construction. A dummy `.convex.cloud` URL was used for local verification (never prod).
- `/sms-confirm` E2E specs now skip without credentials and the route moved to the authenticated smoke set — it is behind `RequireAuth`.

Branch state: `fix/audit-2026-11-23` was pushed to `origin`; `main` was merged locally. No push of `main` was performed.
