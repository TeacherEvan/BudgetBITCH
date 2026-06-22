# Dogfood QA Report

**Target:** http://127.0.0.1:3100
**Date:** 2026-06-23
**Scope:** Full E2E walk-through of the onboarding wizard (Q1-Q10) and exploration of the main dashboard panels (Bento Grid layout, Net Worth panel, Cut One Expense modal, RSS news feed, local-first IndexedDB offline sync to Convex).
**Tester:** Antigravity Agent (automated exploratory QA)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| 🟠 High | 2 |
| 🟡 Medium | 2 |
| 🔵 Low | 0 |
| **Total** | **6** |

**Overall Assessment:** BudgetBITCH runs fully offline-first with robust local-first state, but initially suffered from critical SSR database hangs and onboarding validation bugs that are now completely resolved and verified by E2E test passes.

---

## Issues

### Issue #1: SSR Crash in local-db (ReferenceError: indexedDB is not defined)

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Functional / SSR |
| **URL** | `/wizard` and `/dashboard` |

**Description:**
The server-side rendering (SSR) of both the wizard and dashboard routes crashed with a ReferenceError because the `local-db.ts` file tried to instantiate IndexedDB on the server where `window` is not defined.

**Steps to Reproduce:**
1. Set the auth cookie `budgetbitch:e2e-auth-state=signed-in`.
2. Navigate directly to `/wizard` or `/dashboard` on the server.
3. The page fails to load with HTTP 500 error.

**Expected Behavior:**
The page should render on the server without referencing browser-only APIs or using safe fallbacks.

**Actual Behavior:**
The server-side rendering fails with `ReferenceError: indexedDB is not defined`.

**Screenshot:**
MEDIA:/home/ewaldt/.gemini/antigravity/brain/cc385fc1-3520-48fb-bb1d-f8353a76ea91/screenshots/02_wizard_start_income.png

**Console Errors:**
```
ReferenceError: indexedDB is not defined
    at openDB (webpack-internal:///(app-pages-browser)/./node_modules/idb/build/index.js:53:14)
    at getDB (src/lib/db/local-db.ts:74:24)
```

---

### Issue #2: Promise Hang in local-db Server-Side Proxy

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Functional / SSR |
| **URL** | `/wizard` and `/dashboard` |

**Description:**
To prevent the SSR crash, a dummy database proxy was returned on the server, but it intercepted the `then` property. This caused the JS engine to treat the proxy as a thenable object and await it forever, hanging the server response.

**Steps to Reproduce:**
1. Await `getDB()` on the server side in any rendering code path (e.g., `await getWizardProfile()`).
2. The server request hangs indefinitely and eventually times out.

**Expected Behavior:**
`getDB()` should return a dummy proxy that resolves instantly.

**Actual Behavior:**
The request hangs forever on `await getDB()`.

**Screenshot:**
MEDIA:/home/ewaldt/.gemini/antigravity/brain/cc385fc1-3520-48fb-bb1d-f8353a76ea91/screenshots/02_wizard_start_income.png

**Console Errors:**
```
Test timeout of 30000ms exceeded.
```

---

### Issue #3: Missing Onboarding Wizard Translation namespace in English (`en`)

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Functional / Localization (i18n) |
| **URL** | `/wizard` |

**Description:**
The onboarding wizard failed to render under the English locale because the translation dictionary `src/i18n/messages.ts` was missing the `wizard` translation key block.

**Steps to Reproduce:**
1. Set `bb-locale=en` cookie.
2. Navigate to `/wizard`.
3. The page crashes on mount with `MISSING_MESSAGE: Could not resolve 'wizard' in messages for locale 'en'`.

**Expected Behavior:**
The wizard should translate step instructions and labels into English.

**Actual Behavior:**
The wizard crashes due to the missing translation keys.

**Screenshot:**
MEDIA:/home/ewaldt/.gemini/antigravity/brain/cc385fc1-3520-48fb-bb1d-f8353a76ea91/screenshots/02_wizard_start_income.png

**Console Errors:**
```
IntlError: MISSING_MESSAGE: Could not resolve `wizard` in messages for locale `en`.
    at WizardShell (src/components/wizard/wizard-shell.tsx:105:28)
```

---

### Issue #4: Onboarding Wizard Savings Rate Step Validation Block

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Functional / UX |
| **URL** | `/wizard` |

**Description:**
The user was blocked from progressing past Q8 (Savings Rate) because the step ID `'savingsRate'` did not match the actual answer field name `'savingsRatePct'` stored in the local-db profile schema. The form validation evaluated `stepValues['savingsRate']` as undefined, resulting in a persistent "Please fill in this step" validation error.

**Steps to Reproduce:**
1. Reach Q8 (Savings Rate) in the onboarding wizard.
2. Choose a savings percentage (e.g., 20%).
3. Click "Next".
4. The wizard shows "Please fill in this step" and blocks progression.

**Expected Behavior:**
The wizard should validate the input and transition to the next step.

**Actual Behavior:**
The validation fails and blocks the user.

**Screenshot:**
MEDIA:/home/ewaldt/.gemini/antigravity/brain/cc385fc1-3520-48fb-bb1d-f8353a76ea91/screenshots/10_wizard_risk_tolerance.png

**Console Errors:**
None.

---

### Issue #5: Grid Item Text Overlap in Bento Dashboard Budget Overview

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Visual / Responsive |
| **URL** | `/dashboard` |

**Description:**
The "Income", "Expenses", and "Savings Rate" summary cards in the `Budget Overview` panel overlapped when displayed in a narrow grid column on desktop.

**Steps to Reproduce:**
1. Complete the onboarding wizard and load the dashboard.
2. Locate the "Budget" grid panel.
3. View the three summary cards; the text and values overlap vertically.

**Expected Behavior:**
The cards should shrink, font sizes should adjust, or the elements should wrap to multiple lines to accommodate small panel sizes.

**Actual Behavior:**
The cards overlap and display clipped text.

**Screenshot:**
MEDIA:/home/ewaldt/.gemini/antigravity/brain/cc385fc1-3520-48fb-bb1d-f8353a76ea91/screenshots/13_dashboard_home.png

**Console Errors:**
None.

---

### Issue #6: Playwright Selector Conflict with Next.js Dev Tools

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Test Runner / Functional |
| **URL** | `/wizard` (E2E testing context) |

**Description:**
The E2E tests failed to click the wizard "Next" button because the Next.js dev tools floating action button also matched the `getByRole('button', { name: 'Next' })` query, causing a strict mode violation error in Playwright.

**Steps to Reproduce:**
1. Run Playwright E2E tests in development mode where Next.js dev tools are enabled.
2. The test fails at step 1 clicking "Next".

**Expected Behavior:**
Playwright should click the main form "Next" button.

**Actual Behavior:**
Playwright throws `strict mode violation: getByRole('button', { name: 'Next' }) resolved to 2 elements`.

**Screenshot:**
N/A (E2E assertion error)

**Console Errors:**
None.

---

## Issues Summary Table

| # | Title | Severity | Category | URL |
|---|-------|----------|----------|-----|
| 1 | SSR Crash in local-db (indexedDB is not defined) | 🔴 Critical | Functional / SSR | `/wizard`, `/dashboard` |
| 2 | Promise Hang in local-db Server-Side Proxy | 🔴 Critical | Functional / SSR | `/wizard`, `/dashboard` |
| 3 | Missing Onboarding Wizard Translation namespace in English (`en`) | 🟠 High | Functional / Localization | `/wizard` |
| 4 | Onboarding Wizard Savings Rate Step Validation Block | 🟠 High | Functional / UX | `/wizard` |
| 5 | Grid Item Text Overlap in Bento Dashboard Budget Overview | 🟡 Medium | Visual / Responsive | `/dashboard` |
| 6 | Playwright Selector Conflict with Next.js Dev Tools | 🟡 Medium | Test Runner / Functional | `/wizard` |

## Testing Coverage

### Pages Tested
- `/wizard` (Onboarding steps 1-10)
- `/dashboard` (Main dashboard panels and views)

### Features Tested
- Onboarding flow questionnaire (Income, Rent, Transport, Utilities, etc.)
- Savings Rate picker and slider configuration
- Risk tolerance selection
- Local-first IndexedDB database client-side and server-side state
- Bento Grid panel expansion/collapse
- Cut One Expense recommendation modal
- RSS Briefing panel CORS load handlers

### Not Tested / Out of Scope
- Real Convex database sync (bypassed with E2E authentication override headers/cookies)
- Real voice synthesizers and voice recognition (mocked out in test runners)

---

## Notes

- **Aesthetics & UX:** The application layout uses sleek, dark-themed aesthetics with custom variables (e.g., Amber and Gold presets) matching the design guidelines.
- **SSR Safety:** The server-safe dummy proxy implementation successfully protects browser-only API references (like IndexedDB, localStorage, etc.) from throwing exceptions during Next.js server-side pre-rendering.
