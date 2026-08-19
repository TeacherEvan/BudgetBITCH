# HANDOVER — Quick Add De-monolithization (addendum to HANDOFF.md)

**For:** next agent / reviewer picking up BudgetBITCH (Budget Boss)
**From:** surgical-implementation run `quick-add-demonolith-2026-08-19` (G&L Auditor V2)
**Repo / branch:** `/home/ewaldt/Documents/VS/GAMES/BudgetBITCH` · `main` · remote `TeacherEvan/BudgetBITCH`
**Scope of THIS note:** the single OPEN objective from the 2026-08-18 audit plans —
Milestone 3 / Priority 3 (Quick Add de-monolithization). All other plan objectives were
already shipped by prior merged PRs (see TRACEABILITY.md / debrief.md in this dir).
**Run status:** READY (COMPLETE). Working tree MODIFIED, NOT committed/pushed.

---

## 1. What was DONE (verified on live tree)

| Item | Change | Proof |
|------|--------|-------|
| Extract Quick Add logic into a hook | NEW `src/hooks/use-quick-add-state.ts` (769 lines): all mutation state + handlers (save, scanned-receipt save, repeat-purchase, camera OCR + HF-bot proxy, SMS scrape, permission flow) moved verbatim. Icons kept out (repo hook convention — no lucide in `src/hooks/`). i18n success toasts restored (`t('successAdded')` / `t('successIncome')`). | `npx tsc --noEmit` exit 0; hook test 9/9. |
| Extract camera sheet | NEW `src/components/quick-add/quick-add-camera-sheet.tsx` (48 lines): `fileInputRef` + hidden input + trigger, `data-testid="camera-file-input"` preserved. | page test still finds `camera-file-input`. |
| Thin page render surface | REWRITE `src/app/quick-add/page.tsx`: 819 → 211 lines. Every `data-testid` (camera-file-input, inbox-sms-btn, quick-add-save-btn, scanned-*, repeat-purchase-btn, verified-scraped-card, etc.) preserved verbatim. | page test 17/17; `grep -c data-testid page.tsx` == 2 (the 2 non-derived IDs live on the page; the rest are in child components, unchanged). |
| Hook test | NEW `src/hooks/use-quick-add-state.test.ts` (9 tests): toggle, income-save profile bump, scanned-review population, repeat candidate + tap, note-only saves amount 0, non-image rejection, SMS scrape→confirm. | 9/9 pass. |
| Docs | `docs/CODEBASE_INDEX.md` Quick Add row updated to list the 3 files. | grep confirms. |

## 2. Gate evidence (all GREEN, re-run this session)

```
npx tsc --noEmit                                              → exit 0
npx eslint src/app/quick-add/page.tsx src/components/quick-add/quick-add-camera-sheet.tsx src/hooks/use-quick-add-state.ts src/hooks/use-quick-add-state.test.ts → exit 0 (0 err/warn)
npx vitest run src/app/quick-add/page.test.tsx src/hooks/use-quick-add-state.test.ts → 26 passed (26)
npm test (full)                                              → 124 files, 690 passed / 3 skipped
npm run check:idb                                            → OK (9 stores)
npm run check:csp                                            → OK
npm run check:comments                                      → OK (217 files)
npm run check:convex-imports                                → OK
npm run build                                               → compiled successfully
```

## 3. USER DECISIONS REQUIRED (intentional non-action)

1. **Commit + push:** the 4 quick-add files are uncommitted. Recommended branch
   `refactor/quick-add-demonolith`. Do NOT `git add -A` — keep the working tree's
   OTHER uncommitted changes (convex/_generated, package*.json, AGENTS.md/CLAUDE.md/
   ARCHITECTURE.md/SECURITY.md, next-auth deletions from prior PRs) OUT of this branch.
2. **Playwright E2E before merge:** `tests/e2e/quick-add-manual.spec.ts` exercises the
   same `data-testid`s but was NOT re-run this session (needs a dev server). Run
   `npm run test:e2e` (or at least that spec) before merging.
3. **Cross-contamination guard:** the working tree already holds unrelated modified/
   deleted files from prior merged PRs. The 4 quick-add files are a clean standalone
   change — do not bundle them with the others.

## 4. Non-obvious pitfalls (so you don't re-learn them)

1. **`RefObject<HTMLInputElement | null>`** — in this React version `useRef<HTMLInputElement>(null)`
   yields `RefObject<HTMLInputElement | null>`, not `RefObject<HTMLInputElement>`. The
   page's old inline ref compiled only because it was locally typed; the extracted hook
   must use the `| null` form or tsc fails.
2. **Convex api import depth:** from `src/hooks/` the generated api is
   `../../convex/_generated/api`, NOT `../../../convex/_generated/api` (which is correct
   only from `src/app/`).
3. **`VerifiedSmsData` is NOT exported from `@/lib/types/budget`** — it lives in
   `@/components/quick-add/sms-paste-modal`. Importing it from budget types breaks tsc.
4. **Hook tests need a next-intl mock** — `useTranslations` throws without
   `NextIntlClientProvider`. Mock `next-intl` (`useTranslations: () => (k) => k`) in the
   hook test, like the page test does.
5. **`vi.doMock` cannot override an already-imported module mid-file** — for per-test
   sms-parser stubs use a top-level `vi.fn()` spy (`parseSMSMock`) and call
   `parseSMSMock.mockReturnValue(...)` in the test. The `as never` casts are required
   because the real `ParsedSMSResult` shape is `{ candidates, rawText, detectedCountry }`.

## 5. What the next agent should verify before touching anything

```bash
cd /home/ewaldt/Documents/VS/GAMES/BudgetBITCH
git status -s                                          # confirm ONLY the 4 quick-add files are yours
git remote -v                                         # confirm TeacherEvan/BudgetBITCH
npx tsc --noEmit && npm test && npm run build        # full gate
npm run test:e2e -- tests/e2e/quick-add-manual.spec.ts   # E2E contract (dev server)
```

## 6. Artifacts produced by THIS note's work

- `src/hooks/use-quick-add-state.ts` (new)
- `src/hooks/use-quick-add-state.test.ts` (new)
- `src/components/quick-add/quick-add-camera-sheet.tsx` (new)
- `src/app/quick-add/page.tsx` (rewrite, 819 → 211)
- `docs/CODEBASE_INDEX.md` (Quick Add row)
- `docs/.scratch-audit/2026-08-19-best-practices/{TRACEABILITY.md, debrief.md}` (this run)

---

Handover drafted by conductor. No code changes in this step. Treat the live tree + the gate
commands above as the source of truth, not the plan files.
