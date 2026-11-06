# TODO — 2026-08-19 Best-Practices Audit, Seek, Update & Implement

Run id: `2026-08-19-best-practices` · Repo: BudgetBITCH (`main`)
All objectives traceable to REQUIREMENTS.md ACs. Each carries an evidence block.

## Objectives

### OBJ-001 — Decommission unwired `next-auth` scaffold
- **Requirement:** FR-1 · **AC:** AC-001
- **Affected:** `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`,
  `src/lib/auth/session-claims.ts`, `src/lib/auth/session-claims.test.ts`,
  `src/types/next-auth.d.ts`, `package.json`
- **Acceptance:** `next-auth` removed from package.json; all 5 files deleted;
  zero remaining `next-auth`/`@auth/core` imports outside deleted files;
  `@convex-dev/auth` untouched.
- **Validation:** `grep -rn "next-auth" src convex` returns only (now-absent)
  references; `npm run typecheck` + `npm test` green.
- [x] DONE (verified 2026-08-19: 5 files deleted on disk, zero next-auth/@auth/core
  refs in src/convex, removed from package.json; uncommitted WIP)

### OBJ-002 — Remove redundant `strokeDasharray` in ProgressRing
- **Requirement:** FR-2 · **AC:** AC-002
- **Affected:** `src/components/ui/progress-ring.tsx` (lines 59 + 61)
- **Acceptance:** exactly one `strokeDasharray` (the `style` form); lint+tsc clean.
- **Validation:** `grep -c strokeDasharray progress-ring.tsx` == 1; gate green.
- [ ] TODO

### OBJ-003 — Add `QuickAdd` namespace to all 6 locale catalogs
- **Requirement:** FR-3 · **AC:** AC-003
- **Affected:** `src/i18n/locales/{en,es,fr,de,pt,zh}.ts`
- **Acceptance:** each catalog has a `quickAdd` namespace with identical key set
  (title, placeholder, camera, inbox, save, scanning, parsing, successAdded,
  successIncome, failed, invalidAmount, back, expense, income, permTitle,
  permDesc, rememberChoice, allow, deny, pasteSmsTitle, pasteSmsPlaceholder,
  extractBtn, close); `tsc` satisfied (`LocaleMessages` type).
- **Validation:** `npm run typecheck` green; key counts equal across all 6.
- [x] DONE (verified 2026-08-19: `quickAdd` namespace present in en/es/fr/de/pt/zh;
  uncommitted WIP)

### OBJ-004 — Migrate `quick-add/page.tsx` to `useTranslations('QuickAdd')`
- **Requirement:** FR-3 · **AC:** AC-003
- **Affected:** `src/app/quick-add/page.tsx`
- **Acceptance:** `const labels`/`const l = labels.en` removed; `const t =
  useTranslations('QuickAdd')`; every `l.X` replaced with `t('X')`; en rendering
  identical (parity verified by existing quick-add tests).
- **Validation:** `grep -n "labels.en\|const l =" quick-add/page.tsx` empty;
  `npm test` green; `npm run typecheck` green.
- [x] DONE (verified 2026-08-19: `const labels`/`const l = labels.en` gone,
  `const t = useTranslations('QuickAdd')` present; uncommitted WIP)

### OBJ-005 — Rewrite `SECURITY.md` with an accurate policy
- **Requirement:** FR-4 · **AC:** AC-004
- **Affected:** `SECURITY.md`
- **Acceptance:** describes real stack (Convex Auth Password provider,
  localStorage token for mobile webviews, IndexedDB local-first, VAPID web-push,
  LINE/HMAC + Bearer constant-time verification, no hardcoded secrets, all via
  process.env); no fictional version lines (the "5.1.x" boilerplate removed).
- **Validation:** `grep -n "5.1.x\|white_check_mark" SECURITY.md` empty.
- [x] DONE (verified 2026-08-19: no 5.1.x / white_check_mark boilerplate; uncommitted WIP)

### OBJ-006 — Full gate re-run (lint/typecheck/test/build)
- **Requirement:** NFR-1/2/3 · **AC:** AC-005
- **Affected:** whole repo (verification only)
- **Acceptance:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
  all exit 0.
- **Validation:** captured exit codes in debrief evidence.
- [x] DONE (verified 2026-08-19: lint 0, tsc 0, convex 0, unit 690/3skip, build 0)

### OBJ-007 — Flag wizard `normLocale` typing mismatch (user decision)
- **Requirement:** (out-of-scope per REQUIREMENTS) · **AC:** n/a
- **Affected:** `src/components/wizard/wizard-shell.tsx`, `WizardProfile.locale`
- **Acceptance:** documented as a deliberate NON-action; surfaced to user.
- **Validation:** this objective remains OPEN-with-note; not implemented.
- [ ] TODO (decision required)

### OBJ-008 — Confirm prior-run "done" items stay done (no re-derivation)
- **Requirement:** NFR-3 / anti-fabrication · **AC:** AC-005
- **Affected:** `critical-expenses-modal.tsx` (F1), `confetti.tsx` (F2)
- **Acceptance:** grep confirms F1 fix (`formatCurrency` symbol) + F2 wiring
  (`<Confetti>` rendered in modal) present; no churn.
- **Validation:** evidence recorded in CODEBASE-STATE; no edits made.
- [x] DONE (verified at DISCOVER)

### OBJ-009 — Update `docs/CODEBASE_INDEX.md` / AGENTS.md auth note
- **Requirement:** FR-1 (documentation hygiene) · **AC:** AC-001
- **Affected:** `AGENTS.md` §2 (next-auth scaffold note), `docs/CODEBASE_INDEX.md`
- **Acceptance:** note that the `next-auth` unwired scaffold has been removed;
  shipped auth is 100% Convex Auth.
- **Validation:** grep AGENTS.md for next-auth scaffold wording updated.
- [x] DONE (verified 2026-08-19: AGENTS.md §2 states scaffold removed; CODEBASE_INDEX
  has no next-auth refs)

### OBJ-010 — Produce V2 traceability + debrief artifacts
- **Requirement:** governance · **AC:** all
- **Affected:** `docs/.scratch-audit/2026-08-19-best-practices/`
- **Acceptance:** TRACEABILITY.md (obj→req→test), debrief.md (17 sections),
  runtime manifest/state/events finalized, FINAL_AUDIT status assigned.
- **Validation:** artifacts present and internally consistent.
- [ ] TODO

## Definition of Done
All of OBJ-001..006, 009, 010 ticked; OBJ-008 confirmed; OBJ-007 logged as a
user-facing decision. `npm run ci` green. FINAL_AUDIT status ∈ {READY, READY
WITH WARNINGS} based on evidence.
