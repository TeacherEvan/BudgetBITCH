# HANDOVER NOTES — 2026-08-19 Best-Practices Run

**For:** next agent picking up BudgetBITCH (Budget Boss)
**From:** surgical-implementation run `2026-08-19-best-practices` (G&L Auditor V2)
**Repo / branch:** `/home/ewaldt/Documents/VS/GAMES/BudgetBITCH` · `main` · remote `TeacherEvan/BudgetBITCH`
**Run status:** READY (COMPLETE). Working tree MODIFIED, NOT committed/pushed.

---

## 1. What is DONE (verified on live tree, not by self-report)

| Item | What changed | Proof |
|------|--------------|-------|
| Auth decommission | Deleted `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/lib/auth/session-claims.ts`, `src/lib/auth/session-claims.test.ts`, `src/types/next-auth.d.ts`. `npm uninstall next-auth`; added explicit `@auth/core@^0.41.3` (legit Convex Auth transitive that npm had wrongly pruned). | `grep -rn "next-auth" src convex` → NONE; `package.json` no `next-auth`; `node_modules/@auth/core` present; `node_modules/next-auth` absent. |
| Progress-ring polish | Removed duplicate `strokeDasharray` attribute in `src/components/ui/progress-ring.tsx` (kept the `style` form). | `grep -c strokeDasharray progress-ring.tsx` == 1. |
| i18n migration | `src/app/quick-add/page.tsx` migrated from inline `const labels = { en }` to `useTranslations('QuickAdd')` (13 `t()` sites). `quickAdd` namespace (23 keys) added to all 6 catalogs: `src/i18n/locales/{en,es,fr,de,pt,zh}.ts`. Modal `labels` prop still fed by a catalog-derived `l` (typed `Labels` contract). | quick-add page tests 17/17; `tsc` clean on catalogs; parity (en strings byte-identical). |
| SECURITY.md | Rewrote bogus GitHub boilerplate ("5.1.x" fictional versions) with the real Convex Auth / IndexedDB / VAPID / LINE-HMAC policy. | `grep "5.1.x\|white_check_mark" SECURITY.md` → empty. |
| convex/auth.ts tsc fix | Removed unused `id: "resend"` from the Email provider (never referenced as a `signIn` provider id) + typed `sendVerificationRequest({ identifier, url, token })`. | `npx tsc --noEmit` exit 0 (was failing pre-existingly on clean `main`). |
| Docs | `AGENTS.md` + `CLAUDE.md` (lines ~47-48) updated: unwired next-auth scaffold "removed" (was "is installed"). `docs/ARCHITECTURE.md` next-auth note updated. | grep confirms current docs no longer claim next-auth installed. |

## 2. Gate evidence (all GREEN, re-run by conductor)

```
npm run lint            → exit 0
npm test               → 123 files, 681 passed / 3 skipped / 0 failed
npm run test:convex    → 31 files, 195 passed / 0 failed
npx tsc --noEmit       → exit 0  (zero errors, whole project)
npm run build          → exit 0
```

## 3. OPEN ITEM — requires USER DECISION (intentional non-action, NOT a defect)

**OBJ-007 — Wizard `normLocale` "harmonize to 6 locales":**
- `src/components/wizard/wizard-shell.tsx` line 55: `const normLocale: string = locale || 'en';`
- `WizardProfile.locale` is typed `string | 'en-ZA' | 'en-TH'` (see `src/lib/types/budget.ts`).
- The 2026-08-18 plan said "harmonize wizard to all 6 next-intl locales," but the
  type union does NOT support that. Retyping it is a cross-cutting change
  (profile persistence, server components). It was deliberately NOT applied.
- **Next agent:** only act on this if the user explicitly approves the type
  change. Otherwise leave it.

## 4. Non-obvious pitfalls DISCOVERED (so you don't re-learn them)

1. **`npm uninstall next-auth` prunes `@auth/core`** even though `@convex-dev/auth`
   needs it at runtime (`provider_utils.js` imports it). Symptom: `npm run
   test:convex` → "Cannot find package '@auth/core'". Fix: keep `@auth/core`
   explicitly in `package.json` (done: `^0.41.3`). If you ever remove a package
   that shared a transitive dep with Convex Auth, re-run `test:convex` immediately.
2. **Subagent self-reports are unreliable.** The i18n subagent claimed "typecheck
   clean for all changed files" while the WHOLE-PROJECT `tsc` was red (stale
   `.next/types/validator.ts` from the deleted nextauth route + pre-existing
   convex/auth.ts errors). Always run the full `tsc --noEmit` + `build` yourself
   on the merged tree, not the worker's scoped claim.
3. **`.next/types/validator.ts` error after deleting an API route** is a STALE
   generated type, not a code defect. `npm run build` regenerates `.next` and
   clears it — don't chase it in source.
4. **Protected agent-instruction files** (`AGENTS.md`, `CLAUDE.md`): subagents are
   BLOCKED from editing them by a guard. The primary agent (with user
   authorization) CAN edit them. Don't dispatch a worker to change them; do it
   directly or skip.
5. **Plan artifacts over-claim.** The 2026-08-18 plans marked F1/F2 as
   open/applied, but the live tree already had them done. Verify every plan
   claim against source before acting — re-deriving finished work fabricates diffs.
6. **Don't force-push / don't commit without authorization.** This run left the
   tree modified but uncommitted by design.

## 5. What the next agent should verify before touching anything

```bash
cd /home/ewaldt/Documents/VS/GAMES/BudgetBITCH
git status -s                      # confirm only the expected files changed
git remote -v                     # confirm TeacherEvan/BudgetBITCH (not a wrong checkout)
npm run lint && npm test && npm run test:convex && npx tsc --noEmit && npm run build
```

## 6. Suggested next workstreams (NOT started — unapproved in prior runs)

- OCR pipeline / camera-scan reliability hardening (convex receipts).
- Sync-queue compaction + offline Tesseract WASM pre-cache (was already landed
  per DISCOVER; re-verify before re-doing).
- OBJ-007 wizard locale typing (user decision above).
- Push the current working tree: `git switch -c chore/best-practices-auth-i18n-cleanup`
  then commit scoped changes (do NOT `git add -A` — keep the audit artifacts in
  `docs/.scratch-audit/` separate or exclude per repo convention).

## 7. Artifacts produced by this run

`docs/.scratch-audit/2026-08-19-best-practices/` →
REQUIREMENTS.md, CODEBASE-STATE.md, ARCHITECTURE.md, TODO.md, TRACEABILITY.md,
debrief.md (17 sections), runtime/{manifest.json, state.json, events.jsonl}.

---
Handover drafted by conductor. No code changes in this step. Next agent should
treat the live tree + the gate commands above as the source of truth, not the
plan files.
