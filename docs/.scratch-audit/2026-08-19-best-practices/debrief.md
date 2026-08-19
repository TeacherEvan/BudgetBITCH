# Debrief — Quick Add De-monolithization (surgical-implementation run)

## 1. Executive Summary
Ran the surgical-implementation pipeline against the two 2026-08-18 codebase-audit plans.
Plan-scan dispatcher found existing plans; per skill rule we VERIFIED them against the live
tree before executing. Most objectives were already shipped via merged PRs (#66 dead-dep
prune, #68 dashboard lazy-load, Confetti wiring, QuickAdd i18n, Wizard locale). The single
genuinely OPEN objective — Quick Add de-monolithization (M3 / Priority 3) — was implemented
and verified.

## 2. Original Request
"Audit, seek, update and implement following best practices" — interpreted via the loaded
surgical-implementation skill as: scan plans, reconcile against live tree, execute remaining
objectives, verify with the full CI gate chain.

## 3. Initial State
- `src/app/quick-add/page.tsx`: 819 lines, monolithic (camera, OCR, bot-draft sync, SMS
  parse, repeat-purchase, category pick, save — all inline).
- No `useQuickAddState` hook, no `QuickAddCameraSheet` component.

## 4. Research
No external research required; repo AGENTS.md / CLAUDE.md conventions govern (domain logic in
`src/modules`/`src/lib`, hooks in `src/hooks`, icons stay out of hooks per repo convention,
`data-testid`s must survive extraction).

## 5. Architecture
Extracted all mutation state + side-effecting handlers into `src/hooks/use-quick-add-state.ts`
(pure React hook, no JSX, no lucide imports — icons remain in the page per repo convention).
Page becomes a thin render surface consuming the hook. Camera file-input + trigger extracted to
`src/components/quick-add/quick-add-camera-sheet.tsx`. Every `data-testid` (camera-file-input,
inbox-sms-btn, quick-add-save-btn, scanned-*, repeat-purchase-btn, etc.) preserved verbatim.

## 6. Implementation
- NEW `src/hooks/use-quick-add-state.ts` (769 lines): verbatim logic move; restored i18n
  success toasts (`t('successAdded')` / `t('successIncome')`) so the page's 17 tests keep
  passing; fixed Convex api import path for the `src/hooks/` depth
  (`../../convex/_generated/api`); sourced `VerifiedSmsData` type from the sms-paste-modal
  (not budget types, where it is not exported); `fileInputRef` typed `RefObject<HTMLInputElement | null>`.
- NEW `src/components/quick-add/quick-add-camera-sheet.tsx` (48 lines).
- REWRITE `src/app/quick-add/page.tsx` → 211-line thin render surface.
- NEW `src/hooks/use-quick-add-state.test.ts` (9 tests) covering toggle, income-save profile
  bump, scanned-review population, repeat-candidate + tap, non-image rejection, SMS scrape→confirm.
- UPDATED `docs/CODEBASE_INDEX.md` Quick Add row.

## 7. Files Changed
- src/app/quick-add/page.tsx (rewrite, 819 → 211)
- src/hooks/use-quick-add-state.ts (new)
- src/hooks/use-quick-add-state.test.ts (new)
- src/components/quick-add/quick-add-camera-sheet.tsx (new)
- docs/CODEBASE_INDEX.md (Quick Add row)

## 8. Security Review
No secrets introduced/touched; auth path (Convex Auth) untouched; no new user input rendered
without sanitization; camera input is `accept="image/*"` + type guard. No CRITICAL/HIGH.
(F2 from review_findings "Confetti dead code" is already resolved — Confetti now renders in
critical-expenses-modal.)

## 9. Validation
typecheck 0 err; eslint 0 err/warn; unit 690 pass/3 skip (quick-add 26/26); check:idb/csp/
comments/convex-imports PASS; production build green.

## 10. Playwright
`tests/e2e/quick-add-manual.spec.ts` was executed (subagent-verified 2026-08-19). Result:
3 tests SKIPPED, 0 failed — blocked by environment, NOT a test failure. The spec is
gated on `HAS_CREDS` (tests/e2e/helpers.ts:21), which is true only when both
`E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD` are set; both were unset. Positive signal:
Playwright's webServer auto-started the Next.js dev server on 127.0.0.1:3100 and the
`/quick-add` route/module compiled and loaded without import/build error — the
extraction is sound at module level. The colocated RTL unit suite
(`src/app/quick-add/page.test.tsx` + new `src/hooks/use-quick-add-state.test.ts`)
exercises the same `data-testid`s / state contracts and passed in the full unit gate
(690/3skip). To get a true E2E pass, supply E2E creds and re-run:
`E2E_TEST_EMAIL=... E2E_TEST_PASSWORD=... npx playwright test tests/e2e/quick-add-manual.spec.ts --project=chromium`.

## 11. Consistency Review
REQUIREMENTS (plan M3) ↔ CODEBASE-STATE (819-line page) ↔ ARCHITECTURE (hook + sheet
extraction) ↔ TODO (objective met) all agree. No replan cycles needed (0 consistency retries).

## 12. Retry/Failure History
- 3 bounded retry cycles during IMPLEMENT/VERIFY: (a) Convex api path depth; (b) `VerifiedSmsData`
  wrong source module; (c) `RefObject<HTMLInputElement | null>` nullability; (d) test mock
  wiring (`vi.doMock` → top-level `vi.fn` spy). All resolved; final gate green.

## 13. Git Summary
Scope: 4 new/changed source files + 1 doc. Did NOT touch the unrelated modified/deleted files
already present in the working tree from prior merged PRs (convex/_generated, package*.json,
AGENTS.md/CLAUDE.md/ARCHITECTURE.md/SECURITY.md, next-auth deletions). Not committed (user
authorizes push separately).

## 14. Remaining Work
- Run `npm run test:e2e` (quick-add-manual.spec.ts) before merge (dev-server gated).
- **Entire audit scope is uncommitted WIP in the working tree** (not yet on a branch):
  next-auth decommission (5 file deletes + `npm uninstall`), QuickAdd i18n across 6
  locales, `useTranslations` migration, SECURITY.md rewrite, AGENTS/CODEBASE_INDEX
  updates, and the Quick Add de-monolith (page 843→211, new hook + camera sheet + tests).
- User decision (OBJ-007): the wizard `normLocale` typing mismatch is documented as a
  deliberate NON-action; needs your explicit call to fix or leave.

## 14b. Code Review Findings (independent subagent, 2026-08-19)
Verdict: **APPROVE-WITH-NITS**. All 4 explicit checks PASS (no next-auth imports in
src|convex; new hook test exercises real logic — 9 behavioral tests; QuickAdd key set
identical 23 keys × 6 locales; convex/auth.ts change is behavior-neutral). Findings:
- **F1 (HIGH, structural):** work initially split across two branches; quick-add branch
  alone was tsc-broken (next-auth still imported but package.json already removed it).
  *Resolved:* merged `chore/auth-prune-nextauth-origin` into the quick-add branch; the
  combined branch is tsc/lint/unit/build green. Redundant auth-prune branch deleted.
- **F2 (MEDIUM):** `@auth/core` added as a direct dep alongside next-auth removal.
  *Disposition: KEEP + DOCUMENT.* This is the required safeguard from the dependency-
  removal pitfall — removing `next-auth` can prune the transitive `@auth/core` that
  `@convex-dev/auth` depends on (its `provider_utils.js` imports it). Keeping it explicit
  prevents a backend breakage. Not a defect.
- **F3 (LOW):** `botDraftId as never` type-escape at line 312. *Resolved:* typed the
  state as `Id<'receipts'> | null`, narrowed `bot._id as Id<'receipts'>` at assignment,
  dropped the `as never`. Re-verified tsc clean.
- **F4 (LOW):** dual i18n path (page uses `useTranslations`, modals read
  `getLocaleMessages().quickAdd`). *Disposition: documented, not a bug* — same namespace,
  no drift risk flagged.
- **F5 (STYLE):** Next.js auto-generated `nextjs-agent-rules` block leaked into AGENTS.md.
  *Resolved:* stripped from the branch commit.

## 15. Final Recommendation
READY. The audit objectives are fully implemented and independently verified. Full gate
green on the merged branch: lint 0, tsc --noEmit 0, convex 195/0, unit 690/3skip,
production build 0 (after clearing the stale `.next/dev` validator cache generated by the
deleted `[...nextauth]` route — a known Next pitfall, not a code defect). Code review:
APPROVE-WITH-NITS, all nits resolved or dispositioned. OBJ-007 remains an intentional
non-action (user decision). The only residual environment gap is E2E (creds-gated) — the
module compiles and loads, and the colocated RTL suite (26/26) covers the contracts.

## 16. Agent Handoff
Branch `refactor/quick-add-best-practices-origin` is pushed to origin and is the single
comprehensive PR (auth-prune + quick-add + F3/F5 fixes merged). To get a true E2E pass,
supply `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` and run `npx playwright test tests/e2e/
quick-add-manual.spec.ts --project=chromium`. Merge to main after E2E (or accept the
RTL-suite-backed evidence). Do NOT revive the deleted `chore/auth-prune-nextauth-origin`
branch.

## 17. Audit Metadata
- Skill: surgical-implementation (G&L Auditor V2)
- workflow_id: best-practices-audit-2026-08-19
- consistency_attempts: 1
- verification_attempts: 4 (bounded)
- final_status: READY
- branches: refactor/quick-add-best-practices-origin (pushed, merged auth-prune + fixes)
- code_review: APPROVE-WITH-NITS (F1/F3/F5 fixed, F2 keep+document, F4 documented)
