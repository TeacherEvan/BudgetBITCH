# Settings Feature — Correctness & Best-Practices Overhaul

**Date:** 2026-07-19
**Scope:** Option A — fix real bugs + apply best practices (no i18n catalog migration).
**Target file:** `src/app/settings/page.tsx` (+ its test), supporting tweak in `src/lib/db/local-db.ts`.

## Context

`src/app/settings/page.tsx` is a client page reached at `/settings` (protected by `src/middleware.ts`). A code review surfaced correctness bugs and best-practice gaps:

1. **Destructive reset bug** (line 108): `localStorage.clear()` wipes *all* localStorage — including `budgetbitch:offlineQueue`, `budgetbitch:boardQueue` (pending sync/offline writes), `budgetbitch:theme`, `voiceSettings`, and `bb-locale`. Worse than "delete data"; it can silently discard queued mutations and reset preferences.
2. **Export/sync state conflation** (lines 268–269): the Export button label switches to "Syncing…" when `syncing` is true — but export never toggles `syncing`. Misleading UI.
3. **Broken i18n**: page takes a `locale` prop, but App Router never passes props to client pages, so it is always `'en'`. The entire Thai settings UI is dead. Rest of app uses the `bb-locale` cookie + next-intl (`useLocale()` / `<LocaleSwitcher>`); settings reimplements language with the legacy `budgetbitch:locale` key. Inconsistent + TH never works.
4. **`confirm()` / `alert()`** (lines 106, 148, 151, 164, 166): blocking, unstyled, not accessible. Project already ships an accessible `<Modal>`.
5. **Brittle import** (lines 132–155): loops `for...of items` without checking `Array.isArray`; duplicate store-name lists in export + import; no per-validation feedback.
6. **A11y gaps**: file `<input>` has no label/aria; import/sync feedback only via `alert`.

## Approach

### Task 1 — Shared user-data store constant + safe clear (local-db.ts)
- Export `USER_DATA_STORES` (the 8 user-data object stores: `wizardProfile, expenses, budgets, bills, savingsGoals, netWorthSnapshots, debts, criticalExpenseCommitments`).
- Add `clearAllUserData(): Promise<void>` that clears exactly those 8 stores (reused by reset). Does NOT touch `newsCache`, `locationCache`, `settings`.
- Tests: unit test `clearAllUserData` clears user stores and leaves `settings`/`newsCache` intact (mock `idb` via existing test harness pattern in `local-db.test.tsx`).

### Task 2 — Rewrite settings page to best practices
Remove the `locale` prop and the inline `labels` TH/EN bilingual approach; instead:
- Use `useLocale()` (next-intl) cast to a `SettingsLocale = 'th' | 'en'` (zh falls back to en — documented; zh has no settings strings today).
- Replace the custom language `<Select>` with the existing `<LocaleSwitcher />` (matches app-wide i18n; sets `bb-locale` cookie + `router.refresh()`).
- Keep TH/EN display strings, but keyed off the resolved locale (no behavior change for TH once wired correctly).
- **Reset data**: open a confirm `<Modal>` (destructive styling) instead of `window.confirm`. On confirm: call `clearAllUserData()`, remove only `budgetbitch:lastSync` + `budgetbitch:locale` localStorage keys (preserve `budgetbitch:theme`, `voiceSettings`, `bb-locale`, offline/board queues), then `router.refresh()` / reload to reset UI.
- **Export**: own `exporting` state; button shows "Exporting…" while running, never reuses `syncing`. No `alert` — show inline success status.
- **Import**: guard `Array.isArray(items)`; use shared `USER_DATA_STORES`; on success show inline status; on parse/invalid show inline error status (no `alert`). Add `aria-label` to the file input.
- **Sync**: on success/failure show inline status instead of `alert`.
- Minor: dedupe store list via `USER_DATA_STORES`.

### Task 3 — Expand tests (page.test.tsx)
- Reset now renders a confirm `<Modal>` — test that clicking the destructive button opens the modal (no `window.confirm` call).
- Export button never shows "Syncing…"; shows its own label.
- Locale switcher present (role `combobox`/`select` with `Language` label) instead of legacy Select.
- Keep existing theme-on-mount + lastSync tests green.

## Verification
- `npm run lint`
- `npm test` (vitest) — page + local-db tests pass
- `npm run build` — settings route builds (SSR auth guard already present)

## Out of scope (Option B later)
- Migrating settings strings into `messages.ts` with `useTranslations`.
- Adding a global toast system (using inline status instead, per YAGNI).
