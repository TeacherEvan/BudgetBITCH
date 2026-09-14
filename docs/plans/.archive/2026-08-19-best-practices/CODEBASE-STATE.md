# CODEBASE-STATE — 2026-08-19 Best-Practices Run (final baseline)

**Repo:** BudgetBITCH (Budget Boss) · branch `main` · remote `TeacherEvan/BudgetBITCH`
**Run id:** 2026-08-19-best-practices

## Tech stack (verified against package.json / AGENTS.md)
- Next.js 16.3.0 (App Router) + React 18 + TypeScript strict (path alias `@/*`→`src/*`)
- Convex 1.34.1 backend; auth via `@convex-dev/auth` Password provider
- Local-first IndexedDB (`idb`) + service worker PWA; web-push (VAPID)
- next-intl 4.x (6 locales: en, es, fr, de, pt, zh) via cookie `bb-locale`
- Tailwind v4, framer-motion, recharts, zod, tesseract.js, Gemini 2.5 Flash
- Vitest + RTL (unit), Playwright (E2E), ESLint 9 flat config
- NO Prisma/Clerk/Inngest/next-auth in the shipped auth path

## Relevant structure
```
src/
  app/quick-add/page.tsx          843 LOC — inline labels.en (TARGET FR-3)
  components/ui/progress-ring.tsx  redundant strokeDasharray (TARGET FR-2)
  components/ui/confetti.tsx       already wired (DONE, not reopened)
  components/dashboard/critical-expenses-modal.tsx  F1 already fixed (DONE)
  components/wizard/wizard-shell.tsx  normLocale='en' hardcoded (OUT OF SCOPE)
  i18n/locales/{en,es,fr,de,pt,zh}.ts  typed LocaleMessages (TARGET FR-3)
  i18n/messages.ts                 aggregates locales, supportedLocales
src/auth.ts                         TARGET FR-1 (unwired next-auth)
src/app/api/auth/[...nextauth]/     TARGET FR-1 (unwired next-auth)
convex/                            backend (untouched this run)
```

## Baseline gates (captured at DISCOVER; will be re-run at VERIFY)
- `npm run lint` — expected PASS
- `npm run typecheck` — expected PASS
- `npm test` — expected PASS (656 app + 195 convex per AGENTS.md)
- `npm run build` — expected PASS

## Dependencies (no secret values)
- `next-auth@^5.0.0-beta.32` PRESENT in package.json:58, imports ONLY in the
  unwired `src/auth.ts` + `src/app/api/auth/[...nextauth]` (4 hits, all inside
  the scaffold). Safe to remove.
- `@auth/core`, `@rive-app/canvas`, `agent-browser`, `unrs-resolver` are NOT in
  package.json (prior plan's "5 dead deps" claim was over-stated — only
  `next-auth` exists). No other dead-deps action.

## Known issues / open items (from prior run)
- `HERMES_PLAN.ai.json` workstreams (OCR pipeline, reliability hardening,
  daily-figure/line-bot, i18n/UX) remain UNAPPROVED/proposed.
- Wizard locale typing mismatch (see REQUIREMENTS out-of-scope) — user decision.

## Initial risks
- R-1 (LOW): removing `next-auth` could leave a dangling type import in
  `src/types/next-auth.d.ts` if it exists — must grep before delete.
- R-2 (LOW): adding `QuickAdd` namespace to 6 typed catalogs must satisfy the
  `LocaleMessages` type; a missing key fails tsc. Mitigation: copy the exact key
  set to all 6 files.
