---
name: budgetbitch-repo-orientation
description: Use when working in the BudgetBITCH repo and needing to choose the right starting files or trust the right docs. The app is a single root code tree (a prior nested budgetbitch/ prototype was removed on 2026-07-20).
---

# BudgetBITCH Repo Orientation

## Overview

This repo is a single Next.js + Convex codebase rooted at the repository root.
(A prior nested `budgetbitch/` WorkOS AuthKit prototype subtree existed but was
removed on 2026-07-20; do not look for it.) Start from repo docs first, then
move into the smallest relevant surface.

The user-facing display name is **Budget Boss**; `BudgetBITCH` is the repo /
package name only.

## Quick Reference

| Task | Start here | Avoid |
| --- | --- | --- |
| Root app route/UI change | `AGENTS.md` → `docs/CODEBASE_INDEX.md` → `src/app/**` | Jumping straight into components |
| Root app business logic | `src/modules/**` or `src/lib/**` after the route/API entry point | Editing UI before finding the domain boundary |
| Root Convex work | `convex/_generated/ai/guidelines.md` → `convex/**` | Using memory instead of the Convex repo guidance |
| Auth or route protection | `src/lib/auth/routes.ts` → `route-guard.ts` → `components/auth/**` | Looking for `src/middleware.ts` (there is none) |

## Rules

1. There is one codebase: the root app. Work there by default.
2. Prefer repo docs over memory when deciding where to start. Canonical docs:
   `AGENTS.md` / `CLAUDE.md`, `ARCHITECTURE.md`, `docs/CODEBASE_INDEX.md`,
   `docs/CI_CD.md`.
3. For Convex code, read `convex/_generated/ai/guidelines.md` before changing
   functions, schema, or auth. There is no `convex/README.md`.
4. Auth is Convex Auth (email/password) with `localStorage` tokens and
   client-side guards. `src/auth.ts` + `src/app/api/auth/[...nextauth]` are an
   unwired NextAuth Google scaffold — do not treat them as the live path.
5. Verify with `npm run ci` (or lint / typecheck / check:idb / test /
   test:convex / build individually).

## Common Mistakes

- Starting in `src/components/**` before checking `src/app/**` or `src/modules/**`
- Looking for the removed nested `budgetbitch/` prototype subtree
- Skipping the Convex guidelines and relying on general Convex knowledge
- Assuming Prisma, Clerk, Inngest, or Sentry exist — they do not
- Searching for `src/middleware.ts` for route protection
- Writing "BudgetBITCH" into user-facing UI copy
