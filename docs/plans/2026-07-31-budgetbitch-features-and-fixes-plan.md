# Implementation Plan: BudgetBITCH Onboarding, Flags, Bug Reporting & Install Cleanup

**Date:** 2026-07-31  
**Design Doc:** `docs/plans/2026-07-31-budgetbitch-features-and-fixes-design.md`  
**Status:** In Progress  

---

## Task Breakdown

### Task 1: Restore 10-Question BudgetWizard Flow
- **Files**:
  - `src/components/wizard/wizard-shell.tsx`
  - `src/components/wizard/wizard-shell.test.tsx`
  - `src/lib/types/budget.ts`
- **Steps**:
  1. Write/update unit test in `wizard-shell.test.tsx` to assert that `STEPS` contains all 10 questions and cycles through them (`income`, `rent`, `phoneInternet`, `healthcare`, `transport`, `entertainment`, `subscriptions`, `savingsRate`, `riskTolerance`, `locationConsent`).
  2. Watch test fail.
  3. Update `STEPS` array and `renderStep` switch statement in `wizard-shell.tsx` to render each of the 10 step components with correct prop bindings.
  4. Ensure `saveWizardProfile` captures all 10 answers and sets `completed: true`.
  5. Run tests to confirm pass and commit change.

### Task 2: Implement Country Flags Startup Language Selector (USA 🇺🇸, France 🇫🇷, China 🇨🇳)
- **Files**:
  - `src/components/onboarding/language-select-modal.tsx`
  - `src/components/onboarding/language-select-modal.test.tsx`
  - `src/app/page.tsx`
  - `src/i18n/messages.ts`
- **Steps**:
  1. Write/update unit test in `language-select-modal.test.tsx` asserting that country flag options for USA (🇺🇸), France (🇫🇷), and China (🇨🇳) are rendered.
  2. Watch test fail.
  3. Update `LanguageSelectModal` to render 3 country flag selection buttons: USA 🇺🇸 (`en`), France 🇫🇷 (`fr`), China 🇨🇳 (`zh`).
  4. Update `src/app/page.tsx` to enforce execution order: `GoldenSplash` animation display -> `LanguageSelectModal` -> `CleanAuthCard` login/signup window.
  5. Update `src/i18n/messages.ts` to support `en`, `fr`, and `zh` message lookups.
  6. Run tests to confirm pass and commit change.

### Task 3: Remove Existing Install Feature
- **Files**:
  - `src/app/layout.tsx`
  - `src/components/pwa/install-prompt.tsx`
  - `src/components/pwa/install-prompt.test.tsx`
- **Steps**:
  1. Remove `<PWAInstallPrompt />` invocation from `src/app/layout.tsx`.
  2. Replace `install-prompt.tsx` with a clean no-op component or remove unused export.
  3. Update `install-prompt.test.tsx` to verify no install modal is rendered on layout.
  4. Run tests to confirm pass and commit change.

### Task 4: Action Logger Utility & Bug Reporting with Last 20 Action Logs
- **Files**:
  - `src/lib/utils/action-logger.ts`
  - `src/lib/utils/action-logger.test.tsx`
  - `convex/schema.ts`
  - `convex/feedback.ts`
  - `src/components/bug-report/bug-report-modal.tsx`
  - `src/components/bug-report/bug-report-modal.test.tsx`
- **Steps**:
  1. Create `action-logger.ts` utility that logs up to 20 user actions (ring buffer in memory / `sessionStorage`).
  2. Instrument key UI events (navigation, modal opens, wizard steps, budget additions).
  3. Update `convex/schema.ts` `feedbackReports` table to accept `actionLogs: v.optional(v.array(v.string()))`.
  4. Update `convex/feedback.ts` to set default admin email to `ewieboth@gmail.com` and include `actionLogs` in database insert and email dispatch body.
  5. Create `BugReportModal` component with notes input and automatic last 20 action logs submission.
  6. Write unit tests for action logger and bug report modal; run tests to pass and commit change.

### Task 5: Admin Dashboard Bug Reports View for `ewieboth@gmail.com`
- **Files**:
  - `src/components/admin/admin-bug-reports.tsx`
  - `src/components/admin/admin-bug-reports.test.tsx`
  - `src/components/dashboard/dashboard-shell.tsx`
  - `src/app/settings/page.tsx`
- **Steps**:
  1. Create `AdminBugReports` component that queries `api.feedback.getRecent` and renders submitted bug reports with reporter email, notes, timestamp, and an expandable list of the user's last 20 action logs.
  2. Check if logged-in user email is `ewieboth@gmail.com` in `dashboard-shell.tsx` or `settings/page.tsx`.
  3. If user is `ewieboth@gmail.com`, display the Admin Bug Reports section.
  4. Write unit test for `AdminBugReports` component.
  5. Run test suite to verify everything passes and commit change.

### Task 6: End-to-End Verification & Clean Build Audit
- **Files**:
  - `tests/e2e/*.spec.ts`
- **Steps**:
  1. Run `npx vitest run` to verify all unit & component tests pass cleanly.
  2. Run `npx next build` to ensure zero compilation or TypeScript errors.
