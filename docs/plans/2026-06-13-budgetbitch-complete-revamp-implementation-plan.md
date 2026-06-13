# BudgetBITCH Complete Revamp — Implementation Plan

**Date:** 2026-06-13
**Branch:** `revamp/complete-rewrite`
**Design:** `docs/plans/2026-06-13-budgetbitch-complete-revamp-design.md`
**Dev Tree:** `docs/dev-tree-diagram.md`

---

## Execution Mode: Subagent-Driven (TDD)

Each task follows:
1. **Write failing test** (vitest/Playwright)
2. **Watch fail**
3. **Implement minimal code**
4. **Watch pass**
5. **Commit**
6. **Subagent spec review → code quality review**

---

## Phase 0: Foundation (Prerequisites)

### Task 0.1: Prune package.json
- **Test:** `npm ls` shows no Prisma, Neon, Inngest, Resend, Sentry, cloudflare, pg, @prisma/*, @auth/core, @react-email/*, @vercel/analytics
- **Action:** Remove deps, add `next-pwa`, `rss-parser`, `date-fns-th`, `idb`
- **Verify:** `npm install` succeeds, `npm run build` passes

### Task 0.2: Update .gitignore + Create .cache/
- **Test:** `.cache/` exists, gitignored
- **Action:** Add entries, create folder
- **Verify:** `git status` shows clean

### Task 0.3: Convex Schema + Auth (Minimal)
- **Test:** `npx convex dev` starts, schema validates
- **Files:** `convex/schema.ts`, `convex/auth.config.ts`, `convex/snapshots.ts`
- **Verify:** Convex dashboard shows `dailySnapshots` table

### Task 0.4: Local DB Wrapper (idb) — Version 1
- **Test:** `src/lib/db/local-db.test.ts` — CRUD operations work, migrations run
- **Files:** `src/lib/db/local-db.ts`, `src/lib/db/local-db.test.ts`
- **Stores:** wizardProfile, expenses, budgets, bills, savingsGoals, netWorthSnapshots, debts, criticalExpenseCommitments, newsCache, locationCache, preferredLocale, voiceSettings, privacyDisclaimerAccepted
- **Verify:** `npm test` passes

### Task 0.5: TypeScript Types
- **Test:** `src/lib/types/budget.test.ts` — types compile, validators work
- **Files:** `src/lib/types/budget.ts` (from design), `src/lib/types/budget.test.ts`
- **Verify:** `npx tsc --noEmit` passes

---

## Phase 1: Onboarding — Language Select + PWA Install

### Task 1.1: Language Select Modal
- **Test:** `src/components/onboarding/language-select-modal.test.tsx` — renders TH/EN, saves to localStorage, blocks until selected
- **Files:** `src/components/onboarding/language-select-modal.tsx`
- **UX:** Modal on landing, Thai 🇹🇭 / English 🇺🇸, saves `preferredLocale`, Globe🌐 appears in header

### Task 1.2: PWA Config + Pre-Wizard Install Prompt
- **Test:** `public/manifest.json` valid, `next.config.ts` has next-pwa, SW registers
- **Files:** `next.config.ts`, `public/manifest.json`, `public/sw.js` (workbox)
- **UX:** After language select, before wizard — "Install BudgetBITCH" native prompt

### Task 1.3: Landing Page Redirect Logic
- **Test:** `src/app/page.test.tsx` — unsigned → language select → auth → wizard/dashboard
- **Files:** `src/app/page.tsx`, `src/app/layout.tsx` (providers)

---

## Phase 2: Voice-Guided 10-Question Wizard

### Task 2.1: Voice Hook (Web Speech API)
- **Test:** `src/hooks/use-voice.test.ts` — STT/TTS toggle, Thai/EN voices, rate/pitch
- **Files:** `src/hooks/use-voice.ts`
- **Default:** OFF (user enables)

### Task 2.2: Wizard Shell + Progress + Voice Toggle
- **Test:** `src/components/wizard/wizard-shell.test.tsx` — 10 steps, progress bar, voice toggle persists
- **Files:** `src/components/wizard/wizard-shell.tsx`, `wizard-progress.tsx`, `voice-toggle.tsx`

### Task 2.3: Wizard Steps 1-3 (Income, Rent, Transport)
- **Test:** Each step — validates number, saves to local-db, voice reads question (if enabled), Thai context hints
- **Files:** `step-income.tsx`, `step-rent.tsx`, `step-transport.tsx`
- **Transport hints:** Grab, BTS, fuel, motorbike taxi

### Task 2.4: Wizard Steps 4-7 (Phone/Net, Subscriptions, Entertainment, Healthcare)
- **Test:** Same pattern — number input, Thai context (True/ALT wallet, Netflix/TrueID, 7-Eleven, hospital/clinic)
- **Files:** `step-phone-internet.tsx`, `step-subscriptions.tsx`, `step-entertainment.tsx`, `step-healthcare.tsx`

### Task 2.5: Wizard Step 8 (Savings Rate Slider)
- **Test:** `step-savings-rate.test.tsx` — slider 0-50%, shows daily disposable preview
- **Files:** `step-savings-rate.tsx`

### Task 2.6: Wizard Step 9 (Risk Tolerance)
- **Test:** `step-risk-tolerance.test.tsx` — Low/Med/High cards, affects forecast later
- **Files:** `step-risk-tolerance.tsx`

### Task 2.7: Wizard Step 10 (Location Consent + Privacy Disclaimer)
- **Test:** `step-location-consent.test.tsx` — requests geolocation, shows disclaimer: "We use location ONLY for local prices, fuel alerts, 7-Eleven deals. No marketing. No tracking. Ever.", saves consent
- **Files:** `step-location-consent.tsx`, `src/lib/location/get-location.ts`

### Task 2.8: Wizard Completion → Local DB + Convex Snapshot
- **Test:** Completing wizard saves `WizardProfile` to local-db, triggers daily snapshot sync
- **Files:** `wizard-shell.tsx` (completion handler), `src/lib/convex/sync-snapshots.ts`

---

## Phase 3: Dashboard — Money Pulse (Mobile-First)

### Task 3.1: Header Bar (Globe🌐 + Wrench🔧)
- **Test:** `src/components/layout/header-bar.test.tsx` — shows locale, opens settings modal, persistent
- **Files:** `src/components/layout/header-bar.tsx`

### Task 3.2: Daily Disposable Hero (ONE BIG NUMBER)
- **Test:** `src/components/dashboard/daily-disposable-hero.test.tsx` — calculates (income - fixed - savings) / days in month, THB/USD formatting, updates real-time
- **Files:** `src/components/dashboard/daily-disposable-hero.tsx`, `src/lib/utils/currency.ts`

### Task 3.3: Critical Expenses Modal + Compound Calculator
- **Test:** `src/components/dashboard/critical-expenses-modal.test.tsx` — 8 items with Thai labels, pick one → shows compound projection (7% over 1/5/10 years), saves commitment to local-db
- **Files:** `critical-expenses-modal.tsx`, `compound-savings-calculator.tsx`, `src/lib/utils/compound-calculator.ts`
- **Cost source:** Pre-filled from wizard answers (transport → ride_hailing, entertainment → streaming/impulse), editable

### Task 3.4: Dashboard Shell + Accordion Panels Layout
- **Test:** `src/components/dashboard/dashboard-shell.test.tsx` — hero, critical expense button, 9 accordions, alerts sidebar (mobile: bottom sheet)
- **Files:** `dashboard-shell.tsx`, `alerts-sidebar.tsx`

### Task 3.5: Panel — Expense Tracker
- **Test:** `expense-tracker.test.tsx` — add/edit/delete expenses, category budgets, monthly view, voice input (Thai aliases)
- **Files:** `panels/expense-tracker.tsx`, `src/lib/utils/thai-category-mapper.ts`

### Task 3.6: Panel — Budget Visual (Bar Chart)
- **Test:** `budget-visual.test.tsx` — income vs expense bars, category breakdown, Recharts
- **Files:** `panels/budget-visual.tsx`

### Task 3.7: Panel — Bills (Thai Holidays)
- **Test:** `bills.test.tsx` — due soon sort, calendar view, Thai Buddhist holidays highlighted (`date-fns-th`)
- **Files:** `panels/bills.tsx`, `src/lib/utils/date.ts`

### Task 3.8: Panel — Savings Goals (Progress Rings)
- **Test:** `savings-goals.test.tsx` — create goals, progress rings, auto-allocate from income
- **Files:** `panels/savings-goals.tsx`

### Task 3.9: Panel — Net Worth
- **Test:** `net-worth.test.tsx` — assets/liabilities lists, monthly snapshot, net worth trend
- **Files:** `panels/net-worth.tsx`

### Task 3.10: Panel — Subscriptions (TrueWallet/GrabPay Detection)
- **Test:** `subscriptions.test.tsx` — detects recurring from expenses, shows TrueWallet, GrabPay, Netflix, Spotify
- **Files:** `panels/subscriptions.tsx`

### Task 3.11: Panel — Emergency Fund
- **Test:** `emergency-fund.test.tsx` — target (3-6 months expenses), progress, one-tap allocate
- **Files:** `panels/emergency-fund.tsx`

### Task 3.12: Panel — Debt Payoff (Avalanche/Snowball)
- **Test:** `debt-payoff.test.tsx` — add debts, toggle strategy, shows payoff timeline, interest saved
- **Files:** `panels/debt-payoff.tsx`

### Task 3.13: Panel — Cash Flow Forecast (30/60/90 days)
- **Test:** `cash-flow-forecast.test.tsx` — projects based on income, bills, avg spending, risk tolerance adjusts buffer
- **Files:** `panels/cash-flow-forecast.tsx`

---

## Phase 4: Localized Alerts (RSS)

### Task 4.1: RSS Fetcher + Cache (TH/EN)
- **Test:** `rss-fetcher.test.ts` — fetches Bangkok Post, Thai PBS, Reuters, caches 6h in IndexedDB, filters actionable keywords
- **Files:** `src/lib/news/rss-fetcher.ts`
- **Sources:** Bangkok Post Business/General, Thai PBS, PPTV, Reuters Business/World, fuel prices (custom)

### Task 4.2: Alerts Sidebar (Actionable Cards)
- **Test:** `alerts-sidebar.test.tsx` — shows "Fuel drops tomorrow", "7-Eleven 1+1 Thursday", "BTS monthly pass saves ฿X", locale-aware
- **Files:** `src/components/dashboard/alerts-sidebar.tsx`

---

## Phase 5: Settings + Polish

### Task 5.1: Settings Page
- **Test:** `src/app/settings/page.test.tsx` — locale switch (Globe🌐), voice toggle, theme (amber/dark/gold), data reset, privacy disclaimer re-read
- **Files:** `src/app/settings/page.tsx`

### Task 5.2: Theme — Thai Temple Gold Accent
- **Test:** Visual regression — gold accent on primary actions, critical expense button, progress rings
- **Files:** `src/app/globals.css`, Tailwind config

### Task 5.3: Convex Daily Sync (Service Worker)
- **Test:** `sync-snapshots.test.ts` — SW triggers daily, upserts to Convex, offline queue
- **Files:** `src/lib/convex/sync-snapshots.ts`, `public/sw.js`

---

## Phase 6: Cleanup + Verification

### Task 6.1: Remove Legacy Modules
- **Action:** Delete `src/modules/` (accounting, audit, auth, automation, budgets, calendar, check-ins, dashboard, email, home-location, integrations, jobs, launch, learn, mobile, notifications, personalization, privacy, projections, pwa, start-smart, workspaces)
- **Verify:** No imports from `src/modules/` in remaining code

### Task 6.2: Remove Prisma/Neon
- **Action:** Delete `prisma/`, remove `@prisma/client`, `prisma` from package.json
- **Verify:** `npm run build` passes

### Task 6.3: Full Test Suite
- **Run:** `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`
- **All must pass**

### Task 6.4: Dev Tree Diagram Finalization
- **Action:** Update `docs/dev-tree-diagram.md` to match final structure

---

## Task Summary (Estimated)

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 0: Foundation | 5 | ~2 hrs |
| 1: Onboarding | 3 | ~1.5 hrs |
| 2: Wizard | 8 | ~4 hrs |
| 3: Dashboard | 13 | ~6 hrs |
| 4: Alerts | 2 | ~1 hr |
| 5: Settings | 3 | ~1.5 hrs |
| 6: Cleanup | 4 | ~1 hr |
| **Total** | **38** | **~17 hrs** |

---

## Subagent Dispatch Pattern

For each task:
```bash
# Parent session spawns implementer
sessions_spawn --goal "Task X.Y: [description]" --context "[full plan context]" --files "[exact paths]" --constraints "TDD only, no scope creep" --verify "npm test passes"

# Then spec reviewer
sessions_spawn --goal "Spec review: Task X.Y" --context "Verify implementation matches design spec" --verify "All requirements met"

# Then code quality reviewer
sessions_spawn --goal "Code quality: Task X.Y" --context "Review for TypeScript, React patterns, performance" --verify "No lint errors, follows conventions"
```

---

## Commit Convention

```
feat(wizard): add step-income with voice support
fix(db): handle migration v1->v2
refactor(dashboard): extract compound calculator util
test(alerts): add RSS fetcher integration tests
chore: prune legacy modules
```

---

## Ready to Execute

**Next:** Spawn Task 0.1 implementer subagent.