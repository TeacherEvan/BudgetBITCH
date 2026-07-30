# Design Document: BudgetBITCH Onboarding, Flags, Bug Reporting & Install Cleanup

**Date:** 2026-07-31  
**Author:** Antigravity AI & Pair Programmer  
**Status:** Proposed  

---

## Executive Summary
This design document details four major enhancements and fixes for BudgetBITCH:
1. **10-Question BudgetWizard**: Restoring all 10 setup questions for new users on first login, with re-configuration accessible via Dashboard Settings.
2. **Startup Country Flag Language Selection**: Replacing legacy bilingual options with a startup country flag selector representing USA (🇺🇸), France (🇫🇷), and China (🇨🇳), triggered right after splash animation and before login/signup.
3. **Install Feature Removal**: Removing PWA install prompts and related UI overlays.
4. **Action-Logged Bug Reporting & Admin Dashboard**: Capturing notes and the user's last 20 action logs in bug reports, sending notification emails to `ewieboth@gmail.com`, and rendering an Admin Bug Reports dashboard view for `ewieboth@gmail.com`.

---

## 1. BudgetWizard 10-Question Flow & Settings Redo

### Problem
`WizardShell` in `src/components/wizard/wizard-shell.tsx` currently limits `STEPS` to 3 steps (`income`, `locationConsent`, `receiptScan`). The remaining 7 questions (`rent`, `phoneInternet`, `healthcare`, `transport`, `entertainment`, `subscriptions`, `savingsRate`, `riskTolerance`) exist as component files in `src/components/wizard/steps/` but are omitted from the flow.

### Design Solution
- Update `STEPS` array in `wizard-shell.tsx` to include all 10 steps in logical sequence:
  1. `income` (Monthly Income)
  2. `rent` (Housing / Rent)
  3. `phoneInternet` (Phone & Internet)
  4. `healthcare` (Healthcare & Medical)
  5. `transport` (Transportation & Fuel)
  6. `entertainment` (Entertainment & Outings)
  7. `subscriptions` (Subscriptions & Digital Services)
  8. `savingsRate` (Target Savings Rate %)
  9. `riskTolerance` (Risk Tolerance Level)
  10. `locationConsent` (Location & Region Consent / Complete)
- Ensure wizard triggers **only once** on first login (`wizardCompleted === false`).
- On completion, `saveWizardProfile` saves answers to IndexedDB and syncs daily snapshot to Convex.
- Enable re-doing wizard from settings via `sessionStorage.setItem('bb:wizard-redo', '1')`, which opens the `WizardShell` modal over the dashboard.

---

## 2. Country Flags Language Selection (USA, France, China)

### Problem
Language selection was tied to a bilingual modal with South Africa / Thailand options and rendered after auth.

### Design Solution
- Replace `LanguageSelectModal` options with the 3 main language speaking countries:
  - 🇺🇸 **USA** — English (`en`)
  - 🇫🇷 **France** — Français (`fr`)
  - 🇨🇳 **China** — 中文 (`zh`)
- Update startup order in `src/app/page.tsx`:
  1. Splash screen animation (`GoldenSplash`) plays first.
  2. If locale choice is not set in `localStorage` (`budgetbitch:locale`), show country flag modal (`LanguageSelectModal`).
  3. Upon country flag selection, store decision in `localStorage` & cookie (`bb-locale`), then proceed to display login/signup card (`CleanAuthCard`).
- Add fallback locale definitions for `en`, `fr`, `zh` in `src/i18n/messages.ts`.

---

## 3. Install Feature Removal

### Problem
The PWA install prompt component (`PWAInstallPrompt`) overlays on layout and is no longer required.

### Design Solution
- Remove `<PWAInstallPrompt locale={locale} />` from `src/app/layout.tsx`.
- Deprecate / remove `src/components/pwa/install-prompt.tsx` and update tests to maintain clean suite passes.

---

## 4. Bug Reporting with Action Logs & Admin Dashboard

### Problem
Users need a bug reporting mechanism that sends notes alongside detailed client action history (last 20 actions) to admin `ewieboth@gmail.com`, viewable on an admin dashboard interface.

### Design Solution
- **Action Logger Utility** (`src/lib/utils/action-logger.ts`):
  - Ring-buffer module keeping up to 20 recent user actions in memory and `sessionStorage`.
  - Exposes `logUserAction(actionDescription: string)` and `getUserActionLogs(): string[]`.
  - Instrument key UI handlers (dashboard navigation, wizard steps, transaction additions, settings changes) to call `logUserAction`.
- **Bug Report UI Component** (`src/components/bug-report/bug-report-modal.tsx`):
  - Modal or button in header/settings allowing users to input bug notes.
  - Automatically appends `actionLogger.getUserActionLogs()` to report payload.
- **Convex Schema & Feedback API** (`convex/schema.ts`, `convex/feedback.ts`):
  - Update `feedbackReports` table with `actionLogs: v.optional(v.array(v.string()))`.
  - Default `ADMIN_EMAIL` to `ewieboth@gmail.com`.
- **Admin Dashboard View** (`src/components/admin/admin-bug-reports.tsx`):
  - Displayed on Dashboard or Settings when logged-in user email is `ewieboth@gmail.com`.
  - Lists submitted bug reports with timestamp, reporter email, notes, user-agent, and expander view for the 20 action logs.

---

## Verification Strategy
- **Unit & Integration Tests**: Run `npx vitest run` to verify wizard step progression, language selection, bug report submission, and absence of install prompt.
- **E2E Tests**: Update Playwright spec files (`tests/e2e/auth.spec.ts`, `tests/e2e/wizard.spec.ts`) for the new flag options and 10-step wizard flow.
